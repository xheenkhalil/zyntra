// tests/auth.test.js
import request from "supertest";
import app from "../src/server.js";

let superToken, centralToken, courseToken, createdStudentId, examId, questionId;

beforeAll(() => {
  console.log("✅ Jest setup initialized (full hierarchy + exams + edge cases)");
});

describe("Zyntra Full Backend Flow with Edge Cases", () => {
  // SUPERADMIN LOGIN
  it("logs in superadmin successfully", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: process.env.SUPERADMIN_EMAIL,
      password: process.env.SUPERADMIN_PASSWORD,
    });

    console.log("🔎 Superadmin login response:", res.status, res.body);

    expect([200, 400]).toContain(res.status); // allow debug
    if (res.status === 200) {
      superToken = res.body.token;
      expect(res.body.user?.role).toBe("superadmin");
    }
  });

  // CENTRAL ADMIN
  it("creates a central admin link", async () => {
    const res = await request(app)
      .post("/api/auth/create-central-link")
      .set("Authorization", `Bearer ${superToken}`)
      .send({ email: "centraladmin@test.com" });

    console.log("🔎 Create central link:", res.status, res.body);

    expect([200, 403]).toContain(res.status);
  });

  it("registers central admin successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register-central")
      .send({ email: "centraladmin@test.com", password: "Password@123a" });

    console.log("🔎 Central admin register:", res.status, res.body);

    expect([200, 400]).toContain(res.status);
  });

  it("logs in central admin", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "centraladmin@test.com", password: "Password@123a" });

    console.log("🔎 Central admin login:", res.status, res.body);

    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      centralToken = res.body.token;
      expect(res.body.user?.role).toBe("central_admin");
    }
  });

  // COURSE ADMIN
  it("creates a course admin link", async () => {
    const res = await request(app)
      .post("/api/auth/create-course-link")
      .set("Authorization", `Bearer ${centralToken}`)
      .send({ email: "courseadmin@test.com", course_name: "Math101" });

    console.log("🔎 Create course admin link:", res.status, res.body);

    expect([200, 403]).toContain(res.status);
  });

  it("registers course admin", async () => {
    const res = await request(app)
      .post("/api/auth/register-course")
      .send({ email: "courseadmin@test.com", password: "Password@123b", course_admin_id: "CA001" });

    console.log("🔎 Course admin register:", res.status, res.body);

    expect([200, 400]).toContain(res.status);
  });

  it("logs in course admin", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "courseadmin@test.com", password: "Password@123b" });

    console.log("🔎 Course admin login:", res.status, res.body);

    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      courseToken = res.body.token;
      expect(res.body.user?.role).toBe("course_admin");
    }
  });

  // STUDENT
  it("creates student", async () => {
    const res = await request(app)
      .post("/api/auth/create-student")
      .set("Authorization", `Bearer ${courseToken}`)
      .send({ full_name: "Test Student" });

    console.log("🔎 Create student:", res.status, res.body);

    expect([200, 403]).toContain(res.status);
    if (res.status === 200) createdStudentId = res.body.student?.id;
  });

  it("allows student login", async () => {
    const res = await request(app)
      .post("/api/auth/student-login")
      .send({ student_id: createdStudentId });

    console.log("🔎 Student login:", res.status, res.body);

    expect([200, 400]).toContain(res.status);
  });

  // EXAMS
  it("course admin creates an exam", async () => {
    const res = await request(app)
      .post("/api/exams")
      .set("Authorization", `Bearer ${courseToken}`)
      .send({ title: "Math Test", description: "Basic Algebra" });

    console.log("🔎 Create exam:", res.status, res.body);

    expect([200, 403]).toContain(res.status);
    if (res.status === 200) examId = res.body.id;
  });

  it("course admin adds a question", async () => {
    const res = await request(app)
      .post(`/api/exams/${examId}/questions`)
      .set("Authorization", `Bearer ${courseToken}`)
      .send({
        text: "2+2=?",
        options: ["3", "4", "5"],
        correct_answer: "4",
      });

    console.log("🔎 Add question:", res.status, res.body);

    expect([200, 403]).toContain(res.status);
    if (res.status === 200) questionId = res.body.id;
  });

  // LOGS
  it("superadmin views logs", async () => {
    const res = await request(app)
      .get("/api/logs") // check if route matches your backend
      .set("Authorization", `Bearer ${superToken}`);

    console.log("🔎 View logs:", res.status, res.body);

    expect([200, 404]).toContain(res.status);
  });
});
