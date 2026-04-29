const BASE_URL = window.location.origin;
let selectedChatRoomId = null;
let peerConnection = null;
let localStream = null;
let videoPollTimer = null;
let activeRequestTab = "incoming";
let selectedUserForSkills = null;
let usersCache = [];
let requestCounts = {
    incoming: 0,
    sent: 0,
    rejected: 0
};
const rtcConfiguration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
    ]
};

function parseJson(response) {
    if (!response.ok) {
        return response.text().then((message) => {
            let parsedMessage = message;

            try {
                const errorBody = JSON.parse(message);
                parsedMessage = errorBody.message || errorBody.error || message;
            } catch (error) {
                parsedMessage = message;
            }

            throw new Error(parsedMessage || "Request failed");
        });
    }

    return response.json();
}

function register() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const isAdmin = document.getElementById("isAdmin")?.checked || false;
    const adminCode = document.getElementById("adminCode")?.value.trim() || "";

    if (!name || !email || !password) {
        alert("Please fill all register fields.");
        return;
    }

    fetch(BASE_URL + "/users/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            email,
            password,
            admin: isAdmin,
            adminCode
        })
    })
        .then(parseJson)
        .then(() => {
            alert("User registered successfully");
            window.location.href = "/login.html";
        })
        .catch((err) => alert(err.message || "Registration failed"));
}

function addSkill() {
    const userId = localStorage.getItem("userId");
    const title = document.getElementById("skillTitle").value.trim();
    const description = document.getElementById("skillDescription").value.trim();

    if (!userId) {
        alert("Please login first.");
        return;
    }

    if (!title || !description) {
        alert("Please enter both skill title and description.");
        return;
    }

    fetch(BASE_URL + "/api/skills/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            description,
            user: { id: Number(userId) }
        })
    })
        .then(parseJson)
        .then(() => {
            alert("Skill added successfully");
            document.getElementById("skillTitle").value = "";
            document.getElementById("skillDescription").value = "";
            loadSkills();
        })
        .catch((err) => alert(err.message));
}

function sendRequest() {
    const userId = localStorage.getItem("userId");
    const receiverId = document.getElementById("receiverId").value.trim();

    if (!userId) {
        alert("Please login first.");
        return;
    }

    if (!receiverId) {
        alert("Please enter a receiver user id.");
        return;
    }

    fetch(BASE_URL + "/api/exchange/request", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            sender: { id: Number(userId) },
            receiver: { id: Number(receiverId) }
        })
    })
        .then(parseJson)
        .then(() => {
            alert("Request sent successfully");
            document.getElementById("receiverId").value = "";
            loadRequests();
            updateRequestCounts();
            loadAdminRequests();
        })
        .catch((err) => alert(err.message));
}

function loadSkills() {
    const skillList = document.getElementById("skillList");
    const userId = localStorage.getItem("userId");
    if (!skillList) {
        return;
    }

    fetch(BASE_URL + "/api/skills/all")
        .then(parseJson)
        .then((data) => {
            const ownSkills = (data || []).filter((skill) => skill.user?.id === Number(userId));
            let html = "";
            ownSkills.forEach((skill) => {
                html += `<div class="data-card"><p><b>${skill.title}</b></p><p>${skill.description || ""}</p></div>`;
            });
            skillList.innerHTML = html || "<p>No skills added yet.</p>";
            updateHeroCounts({ mySkills: ownSkills.length });
        })
        .catch((err) => console.log(err));
}

function loadUsers() {
    const userList = document.getElementById("userList");
    if (!userList) {
        return;
    }

    fetch(BASE_URL + "/users")
        .then(parseJson)
        .then((data) => {
            usersCache = data || [];
            updateHeroCounts({ totalUsers: usersCache.length });
            renderUsers(data);
        })
        .catch((err) => console.log(err));
}

function renderUsers(data) {
    const userList = document.getElementById("userList");
    if (!userList) {
        return;
    }

    let html = "";
    data.forEach((user) => {
        html += `
            <div class="data-card ${selectedUserForSkills === user.id ? "selected-card" : ""}">
                <p><b>ID:</b> <button type="button" class="inline-id-button" onclick="loadSkillsForUser(${user.id})">${user.id}</button></p>
                <p><b>Name:</b> ${user.name}${user.admin ? " (Admin)" : ""}</p>
                <p><b>Email:</b> ${user.email}</p>
                <div class="action-row">
                    <button type="button" class="secondary-button" onclick="loadSkillsForUser(${user.id})">View Skills</button>
                    <button type="button" class="secondary-button" onclick="prefillReceiver(${user.id})">Request</button>
                </div>
            </div>
        `;
    });

    userList.innerHTML = html || "<p>No users found.</p>";
}

function filterUsers() {
    const searchValue = (document.getElementById("userSearchInput")?.value || "").trim().toLowerCase();
    const filteredUsers = usersCache.filter((user) => {
        const text = `${user.id} ${user.name || ""} ${user.email || ""}`.toLowerCase();
        return text.includes(searchValue);
    });
    renderUsers(filteredUsers);
}

function loadRequests() {
    const requestList = document.getElementById("requestList");
    const userId = localStorage.getItem("userId");
    if (!requestList || !userId) {
        return;
    }

    const endpoint = getRequestEndpoint(activeRequestTab, userId);
    fetch(endpoint)
        .then(parseJson)
        .then((data) => {
            renderRequests(data, requestList);
            updateRequestCounts();
        })
        .catch((err) => console.log(err));
}

function getRequestEndpoint(tabName, userId) {
    if (tabName === "sent") {
        return BASE_URL + "/api/exchange/sent/" + userId;
    }

    if (tabName === "rejected") {
        return BASE_URL + "/api/exchange/status/REJECTED";
    }

    return BASE_URL + "/api/exchange/received/" + userId;
}

function renderRequests(data, requestList) {
    const userId = Number(localStorage.getItem("userId"));
    const filteredData = (data || []).filter((req) => {
        if (activeRequestTab === "rejected") {
            return req.sender?.id === userId || req.receiver?.id === userId;
        }

        if (activeRequestTab === "incoming") {
            return req.receiver?.id === userId;
        }

        return req.sender?.id === userId;
    });

    let html = "";
    filteredData.forEach((req) => {
        const actions = activeRequestTab === "incoming" && (req.status || "").toUpperCase() === "PENDING"
            ? `
                <div class="action-row">
                    <button onclick="acceptRequest(${req.id})">Accept</button>
                    <button onclick="rejectRequest(${req.id})">Reject</button>
                </div>
            `
            : "";

        html += `
            <div class="data-card">
                <p><b>ID:</b> ${req.id}</p>
                <p><b>Sender:</b> ${req.sender?.name || req.sender?.id || ""}</p>
                <p><b>Receiver:</b> ${req.receiver?.name || req.receiver?.id || ""}</p>
                <p><b>Status:</b> <span class="status-pill status-${(req.status || "").toLowerCase()}">${req.status}</span></p>
                ${actions}
            </div>
        `;
    });

    const emptyMessage = activeRequestTab === "sent"
        ? "No requests sent to other IDs yet."
        : activeRequestTab === "rejected"
            ? "No rejected requests found."
            : "No incoming requests found.";
    requestList.innerHTML = html || `<p>${emptyMessage}</p>`;
}

function switchRequestTab(tabName, clickedButton) {
    activeRequestTab = tabName;
    document.querySelectorAll(".tab-button").forEach((button) => {
        button.classList.remove("active-tab");
    });

    if (clickedButton) {
        clickedButton.classList.add("active-tab");
    }

    loadRequests();
}

function updateRequestCounts() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        return;
    }

    Promise.all([
        fetch(BASE_URL + "/api/exchange/received/" + userId).then(parseJson),
        fetch(BASE_URL + "/api/exchange/sent/" + userId).then(parseJson),
        fetch(BASE_URL + "/api/exchange/status/REJECTED").then(parseJson)
    ])
        .then(([incomingRequests, sentRequests, rejectedRequests]) => {
            const currentUserId = Number(userId);
            requestCounts.incoming = (incomingRequests || []).filter((req) => req.receiver?.id === currentUserId).length;
            requestCounts.sent = (sentRequests || []).filter((req) => req.sender?.id === currentUserId).length;
            requestCounts.rejected = (rejectedRequests || []).filter((req) => req.sender?.id === currentUserId || req.receiver?.id === currentUserId).length;
            applyRequestCounts();
        })
        .catch((error) => console.log(error));
}

function applyRequestCounts() {
    const incomingCount = document.getElementById("incomingCount");
    const sentCount = document.getElementById("sentCount");
    const rejectedCount = document.getElementById("rejectedCount");
    const incomingTab = document.getElementById("incomingTab");
    const sentTab = document.getElementById("sentTab");
    const rejectedTab = document.getElementById("rejectedTab");

    if (incomingCount) {
        incomingCount.textContent = requestCounts.incoming;
    }

    if (sentCount) {
        sentCount.textContent = requestCounts.sent;
    }

    if (rejectedCount) {
        rejectedCount.textContent = requestCounts.rejected;
    }

    if (incomingTab) {
        incomingTab.textContent = `Incoming (${requestCounts.incoming})`;
    }

    if (sentTab) {
        sentTab.textContent = `Other ID Requests (${requestCounts.sent})`;
    }

    if (rejectedTab) {
        rejectedTab.textContent = `Reject (${requestCounts.rejected})`;
    }
}

function acceptRequest(id) {
    fetch(BASE_URL + "/api/exchange/accept/" + id, {
        method: "PUT"
    })
        .then(parseJson)
        .then(() => {
            alert("Accepted");
            loadRequests();
            updateRequestCounts();
            loadChatRooms();
            loadAdminRequests();
        })
        .catch((err) => alert(err.message));
}

function rejectRequest(id) {
    fetch(BASE_URL + "/api/exchange/reject/" + id, {
        method: "PUT"
    })
        .then(parseJson)
        .then(() => {
            alert("Rejected");
            loadRequests();
            updateRequestCounts();
            loadAdminRequests();
        })
        .catch((err) => alert(err.message));
}

function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    fetch(BASE_URL + "/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            password
        })
    })
        .then(parseJson)
        .then((data) => {
            alert("Login Success");
            localStorage.setItem("userId", data.id);
            localStorage.setItem("userName", data.name || "");
            localStorage.setItem("isAdmin", data.admin === true ? "true" : "false");
            window.location.href = "/dashboard.html";
        })
        .catch((err) => alert(err.message || "Login Failed"));
}

function toggleResetPasswordPanel(forceState) {
    const resetPanel = document.getElementById("resetPasswordPanel");
    if (!resetPanel) {
        return;
    }

    const shouldShow = typeof forceState === "boolean"
        ? forceState
        : resetPanel.classList.contains("hidden-panel");

    resetPanel.classList.toggle("hidden-panel", !shouldShow);
}

function resetPassword() {
    const email = document.getElementById("resetEmail")?.value.trim() || "";
    const newPassword = document.getElementById("resetPasswordNew")?.value.trim() || "";
    const confirmPassword = document.getElementById("resetPasswordConfirm")?.value.trim() || "";

    if (!email || !newPassword || !confirmPassword) {
        alert("Please fill all reset password fields.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
    }

    fetch(BASE_URL + "/users/reset-password", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email,
            newPassword
        })
    })
        .then(parseJson)
        .then(() => {
            alert("Password reset successful. Please login with your new password.");
            document.getElementById("resetEmail").value = "";
            document.getElementById("resetPasswordNew").value = "";
            document.getElementById("resetPasswordConfirm").value = "";
            toggleResetPasswordPanel(false);
            const loginEmail = document.getElementById("email");
            if (loginEmail && !loginEmail.value.trim()) {
                loginEmail.value = email;
            }
            document.getElementById("password")?.focus();
        })
        .catch((err) => alert(err.message || "Password reset failed"));
}

function submitOnEnter(event, callback) {
    if (event.key === "Enter" && typeof callback === "function") {
        callback();
    }
}

function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("isAdmin");
    window.location.href = "/login.html";
}

function toggleAdminPanel() {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const adminPanel = document.getElementById("adminPanel");
    if (!adminPanel) {
        return;
    }

    if (isAdmin) {
        adminPanel.classList.remove("hidden-panel");
        loadAdminRequests();
    } else {
        adminPanel.classList.add("hidden-panel");
    }
}

function loadSkillsForUser(userId) {
    selectedUserForSkills = userId;
    const selectedUserLabel = document.getElementById("selectedUserLabel");
    const selectedUserSkills = document.getElementById("selectedUserSkills");
    const selectedUser = usersCache.find((user) => user.id === Number(userId));
    const userName = selectedUser?.name || "user";

    if (selectedUserLabel) {
        selectedUserLabel.textContent = `Showing skills for ${userName || "user"} (ID ${userId})`;
    }

    const requestSelectedUserButton = document.getElementById("requestSelectedUserButton");
    if (requestSelectedUserButton) {
        requestSelectedUserButton.disabled = false;
    }

    renderUsers(filterUsersForCurrentText());

    if (!selectedUserSkills) {
        return;
    }

    fetch(BASE_URL + "/api/skills/all")
        .then(parseJson)
        .then((skills) => {
            const userSkills = (skills || []).filter((skill) => skill.user?.id === Number(userId));
            let html = "";
            userSkills.forEach((skill) => {
                html += `<div class="data-card"><p><b>${skill.title}</b></p><p>${skill.description || ""}</p></div>`;
            });
            selectedUserSkills.innerHTML = html || "<p>No skills added by this user yet.</p>";
        })
        .catch((err) => {
            selectedUserSkills.innerHTML = `<p>${err.message}</p>`;
        });
}

function prefillReceiver(userId) {
    const receiverInput = document.getElementById("receiverId");
    if (receiverInput) {
        receiverInput.value = userId;
        receiverInput.focus();
    }
}

function requestSelectedUser() {
    if (!selectedUserForSkills) {
        alert("Select a user first.");
        return;
    }

    prefillReceiver(selectedUserForSkills);
}

function refreshDashboard() {
    loadUsers();
    loadSkills();
    loadRequests();
    loadChatRooms();
    updateRequestCounts();
    if (selectedUserForSkills) {
        loadSkillsForUser(selectedUserForSkills);
    }
}

function filterUsersForCurrentText() {
    const searchValue = (document.getElementById("userSearchInput")?.value || "").trim().toLowerCase();
    return usersCache.filter((user) => {
        const text = `${user.id} ${user.name || ""} ${user.email || ""}`.toLowerCase();
        return text.includes(searchValue);
    });
}

function updateHeroCounts(values) {
    const totalUsersCount = document.getElementById("totalUsersCount");
    const mySkillsCount = document.getElementById("mySkillsCount");
    const openChatsCount = document.getElementById("openChatsCount");

    if (typeof values.totalUsers === "number" && totalUsersCount) {
        totalUsersCount.textContent = values.totalUsers;
    }

    if (typeof values.mySkills === "number" && mySkillsCount) {
        mySkillsCount.textContent = values.mySkills;
    }

    if (typeof values.openChats === "number" && openChatsCount) {
        openChatsCount.textContent = values.openChats;
    }
}

function loadAdminRequests() {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const adminRequestList = document.getElementById("adminRequestList");
    if (!isAdmin || !adminRequestList) {
        return;
    }

    fetch(BASE_URL + "/api/exchange/all")
        .then(parseJson)
        .then((data) => {
            let html = "";
            data.forEach((req) => {
                html += `
                <div class="data-card">
                    <p><b>Request ID:</b> ${req.id}</p>
                    <p><b>Sender:</b> ${req.sender?.name || req.sender?.id || ""}</p>
                    <p><b>Receiver:</b> ${req.receiver?.name || req.receiver?.id || ""}</p>
                    <p><b>Status:</b> <span class="status-pill status-${(req.status || "").toLowerCase()}">${req.status}</span></p>
                </div>
            `;
            });
            adminRequestList.innerHTML = html || "<p>No requests available.</p>";
        })
        .catch((err) => {
            adminRequestList.innerHTML = `<p>${err.message}</p>`;
        });
}

function loadChatRooms() {
    const userId = localStorage.getItem("userId");
    const chatRoomList = document.getElementById("chatRoomList");
    if (!userId || !chatRoomList) {
        return;
    }

    fetch(BASE_URL + "/api/chat/rooms/" + userId)
        .then(parseJson)
        .then((rooms) => {
            updateHeroCounts({ openChats: (rooms || []).length });
            let html = "";
            rooms.forEach((room) => {
                const otherUser = room.sender?.id === Number(userId) ? room.receiver : room.sender;
                html += `
                <div class="data-card chat-room-card ${selectedChatRoomId === room.id ? "active-room" : ""}">
                    <p><b>${otherUser?.name || "Chat Room"}</b></p>
                    <p>Request #${room.id}</p>
                    <button type="button" onclick="openChatRoom(${room.id})">Open Chat</button>
                </div>
            `;
            });
            chatRoomList.innerHTML = html || "<p>No accepted chat rooms yet.</p>";
        })
        .catch((err) => {
            chatRoomList.innerHTML = `<p>${err.message}</p>`;
        });
}

function openChatRoom(roomId) {
    selectedChatRoomId = roomId;
    loadChatRooms();
    loadChatMessages();
    startSignalPolling();
}

function loadChatMessages() {
    const userId = localStorage.getItem("userId");
    const chatMessages = document.getElementById("chatMessages");
    if (!userId || !chatMessages) {
        return;
    }

    if (!selectedChatRoomId) {
        chatMessages.innerHTML = "<p>Select an accepted request to start chatting.</p>";
        return;
    }

    fetch(BASE_URL + "/api/chat/messages/" + selectedChatRoomId + "?userId=" + userId)
        .then(parseJson)
        .then((messages) => {
            let html = "";
            messages.forEach((message) => {
                const ownMessage = message.sender?.id === Number(userId);
                html += `
                <div class="chat-message ${ownMessage ? "own-message" : ""}">
                    <p><b>${message.sender?.name || "User"}:</b> ${message.content}</p>
                    <span>${message.sentAt ? message.sentAt.replace("T", " ") : ""}</span>
                </div>
            `;
            });
            chatMessages.innerHTML = html || "<p>No messages yet. Start the conversation.</p>";
            chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch((err) => {
            chatMessages.innerHTML = `<p>${err.message}</p>`;
        });
}

function sendChatMessage() {
    const userId = localStorage.getItem("userId");
    const chatMessageInput = document.getElementById("chatMessageInput");
    const content = chatMessageInput?.value.trim() || "";

    if (!selectedChatRoomId) {
        alert("Open an accepted chat first.");
        return;
    }

    if (!content) {
        alert("Please type a message.");
        return;
    }

    fetch(BASE_URL + "/api/chat/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            exchangeRequestId: selectedChatRoomId,
            senderId: Number(userId),
            content
        })
    })
        .then(parseJson)
        .then(() => {
            chatMessageInput.value = "";
            loadChatMessages();
        })
        .catch((err) => alert(err.message));
}

async function ensureLocalMedia() {
    if (localStream) {
        return localStream;
    }

    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const localVideo = document.getElementById("localVideo");
    if (localVideo) {
        localVideo.srcObject = localStream;
    }

    return localStream;
}

async function createPeerConnection() {
    if (peerConnection) {
        return peerConnection;
    }

    const stream = await ensureLocalMedia();
    peerConnection = new RTCPeerConnection(rtcConfiguration);

    stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById("remoteVideo");
        if (remoteVideo && event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
        }
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate && selectedChatRoomId) {
            sendVideoSignal("ice", JSON.stringify(event.candidate));
        }
    };

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection && ["disconnected", "failed", "closed"].includes(peerConnection.connectionState)) {
            cleanupPeerConnection(false);
        }
    };

    return peerConnection;
}

async function startVideoCall() {
    if (!selectedChatRoomId) {
        alert("Open a private room first.");
        return;
    }

    try {
        const pc = await createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendVideoSignal("offer", JSON.stringify(offer));
        startSignalPolling();
    } catch (error) {
        alert(error.message || "Unable to start video call.");
    }
}

async function sendVideoSignal(signalType, payload) {
    const userId = localStorage.getItem("userId");
    await fetch(BASE_URL + "/api/video/signal", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            exchangeRequestId: selectedChatRoomId,
            senderId: Number(userId),
            signalType,
            payload
        })
    }).then(parseJson);
}

function startSignalPolling() {
    if (videoPollTimer) {
        clearInterval(videoPollTimer);
    }

    const userId = localStorage.getItem("userId");
    if (!selectedChatRoomId || !userId) {
        return;
    }

    videoPollTimer = setInterval(async () => {
        try {
            const signals = await fetch(BASE_URL + "/api/video/signals/" + selectedChatRoomId + "?receiverId=" + userId)
                .then(parseJson);
            for (const signal of signals) {
                await handleIncomingSignal(signal);
            }
        } catch (error) {
            console.log(error);
        }
    }, 2000);
}

async function handleIncomingSignal(signal) {
    if (!signal || !signal.signalType) {
        return;
    }

    if (signal.signalType === "end") {
        cleanupPeerConnection(true);
        return;
    }

    const pc = await createPeerConnection();

    if (signal.signalType === "offer") {
        const offer = JSON.parse(signal.payload);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sendVideoSignal("answer", JSON.stringify(answer));
        return;
    }

    if (signal.signalType === "answer") {
        const answer = JSON.parse(signal.payload);
        if (!pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
        return;
    }

    if (signal.signalType === "ice") {
        const candidate = JSON.parse(signal.payload);
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
}

async function endVideoCall() {
    if (selectedChatRoomId) {
        try {
            await sendVideoSignal("end", "");
        } catch (error) {
            console.log(error);
        }
    }
    cleanupPeerConnection(true);
}

function cleanupPeerConnection(stopLocalStream) {
    if (peerConnection) {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.close();
        peerConnection = null;
    }

    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo) {
        remoteVideo.srcObject = null;
    }

    if (stopLocalStream && localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
        const localVideo = document.getElementById("localVideo");
        if (localVideo) {
            localVideo.srcObject = null;
        }
    }
}
