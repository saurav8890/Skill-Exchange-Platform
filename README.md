Skill Exchange Platform
ExSkill is a Spring Boot skill-exchange application where users can register, list skills, send exchange requests, chat after a request is accepted, and exchange video-call signaling messages.

Features
User registration, login, password reset, and admin registration support
Skill listing by users
Skill exchange requests with PENDING, ACCEPTED, and REJECTED statuses
Private chat rooms for accepted exchange requests
Video call signaling API for accepted exchange requests
Static frontend pages served from Spring Boot
MySQL persistence with Spring Data JPA
Tech Stack
Java 17
Spring Boot 4.0.4
Spring Web MVC
Spring Data JPA
Spring Security
MySQL
Maven Wrapper
Lombok
HTML, CSS, and JavaScript frontend
Project Structure
src/main/java/com/exskill/exskill
  config/        Spring security and API exception handling
  controller/    REST and frontend route controllers
  model/         JPA entities
  repository/    Spring Data repositories
  service/       Business logic

src/main/resources
  static/        Static HTML, CSS, and JavaScript files
  templates/     Template HTML files
  application.properties
Prerequisites
Java 17 or newer
MySQL running locally
Maven is optional because the project includes mvnw and mvnw.cmd
Database Setup
Create a MySQL database named exskill:

CREATE DATABASE exskill;
The current database configuration is in src/main/resources/application.properties:

spring.datasource.url=jdbc:mysql://localhost:3306/exskill
spring.datasource.username=root
spring.datasource.password=password
server.port=8080
spring.jpa.hibernate.ddl-auto=update
Update the username and password if your local MySQL credentials are different.

Run Locally
On Windows:

.\mvnw.cmd spring-boot:run
On macOS or Linux:

./mvnw spring-boot:run
Open the app at:

http://localhost:8080
Useful frontend routes:

http://localhost:8080/index.html
http://localhost:8080/login.html
http://localhost:8080/dashboard.html
Build and Test
Run tests:

.\mvnw.cmd test
Build the project:

.\mvnw.cmd clean package
Run the packaged application:

java -jar target/exskill-0.0.1-SNAPSHOT.jar
API Endpoints
Users
Method	Endpoint	Description
POST	/users/register	Register a user
POST	/users/login	Log in with name/email and password
POST	/users/reset-password	Reset a user's password
GET	/users	Get all users
Register example:

{
  "name": "Saurav",
  "email": "saurav@example.com",
  "password": "test"
}
Admin registration requires:

{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "test",
  "admin": true,
  "adminCode": "EXSKILL_ADMIN_2026"
}
Login example:

{
  "email": "saurav@example.com",
  "password": "test"
}
Skills
Method	Endpoint	Description
POST	/api/skills/add	Add a skill
GET	/api/skills/all	Get all skills
GET	/api/skills/user/{userId}	Get skills for a user
Skill example:

{
  "title": "Java",
  "description": "Spring Boot development",
  "user": {
    "id": 1
  }
}
Exchange Requests
Method	Endpoint	Description
POST	/api/exchange/request	Send an exchange request
PUT	/api/exchange/accept/{id}	Accept an exchange request
PUT	/api/exchange/reject/{id}	Reject an exchange request
GET	/api/exchange/sent/{userId}	Get sent requests
GET	/api/exchange/received/{userId}	Get received requests
GET	/api/exchange/all	Get all requests
GET	/api/exchange/status/{status}	Get requests by status
Exchange request example:

{
  "sender": {
    "id": 1
  },
  "receiver": {
    "id": 2
  },
  "skillOffered": {
    "id": 1
  },
  "skillWanted": {
    "id": 2
  }
}
Chat
Chat is available only for accepted exchange requests.

Method	Endpoint	Description
GET	/api/chat/rooms/{userId}	Get accepted chat rooms for a user
GET	/api/chat/messages/{exchangeRequestId}?userId={userId}	Get messages in a room
POST	/api/chat/send	Send a chat message
Message example:

{
  "exchangeRequestId": 1,
  "senderId": 1,
  "content": "Hi, ready to exchange Java for UI design?"
}
Video Signaling
Video signaling is available only for accepted exchange requests.

Method	Endpoint	Description
POST	/api/video/signal	Send a video call signal
GET	/api/video/signals/{exchangeRequestId}?receiverId={receiverId}	Poll undelivered signals
Signal example:

{
  "exchangeRequestId": 1,
  "senderId": 1,
  "signalType": "offer",
  "payload": "{...}"
}
Notes
CSRF is disabled and all requests are currently permitted in Securityconfig.
Passwords are currently stored as plain text. For production, add password hashing before saving users.
The app uses spring.jpa.hibernate.ddl-auto=update, so Hibernate updates tables automatically during development.
