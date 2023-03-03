const request = require("supertest");
const { server } = require("../server/app");
const User = require("../server/models/user");
const { testUserId, testUser, configureDatabase } = require("./fixtures/db");

beforeEach(configureDatabase);

test("Should register a user", async () => {
  const response = await request(server)
    .post("/users")
    .send({
      firstName: "Mike",
      lastName: "Super",
      phoneNumber: "+380000000000",
      password: "test123"
    })
    .expect(201);

  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  expect(response.body).toMatchObject({
    user: {
      firstName: "Mike",
      lastName: "Super",
      phoneNumber: "+380000000000"
    },
    token: user.tokens[0].token
  });

  expect(user.password).not.toBe("test123");
});

test("Should login user", async () => {
  const response = await request(server)
    .post("/users/login")
    .send({
      phoneNumber: testUser.phoneNumber,
      password: testUser.password
    })
    .expect(200);
  const user = await User.findById(testUserId);
  expect(response.body.token).toBe(user.tokens[1].token);
});

test("Should not login not existing user", async () => {
  await request(server)
    .post("/users/login")
    .send({
      phoneNumber: testUser.phoneNumber,
      password: "dumpData"
    })
    .expect(400);
});

test("Should get an user profile", async () => {
  await request(server)
    .get("/users/me")
    .set("Authorization", `Bearer ${testUser.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should not get profile for unauthenticated user", async () => {
  await request(server)
    .get("/users/me")
    .send()
    .expect(401);
});

test("Should delete user profile", async () => {
  await request(server)
    .delete("/users/me")
    .set("Authorization", `Bearer ${testUser.tokens[0].token}`)
    .send()
    .expect(200);

  const user = await User.findById(testUserId);
  expect(user).toBeNull();
});

test("Should not delete profile unauthenticated for user", async () => {
  await request(server)
    .delete("/users/me")
    .send()
    .expect(401);
});

test("Should upload avatar image", async () => {
  await request(server)
    .post("/users/me/profile-pic")
    .set("Authorization", `Bearer ${testUser.tokens[0].token}`)
    .attach("profile-pic", "tests/fixtures/delivery-icon.jpg")
    .expect(200);

  const user = await User.findById(testUserId);
  expect(user.image).toEqual(expect.any(Buffer));
});

test("Should update user information", async () => {
  await request(server)
    .patch("/users/me")
    .set("Authorization", `Bearer ${testUser.tokens[0].token}`)
    .send({
      firstName: "Nazarii"
    })
    .expect(200);

  const user = await User.findById(testUserId);
  expect(user.firstName).toEqual("Nazarii");
});

test("Should not update invalid user fields", async () => {
  await request(server)
    .patch("/users/me")
    .set("Authorization", `Bearer ${testUser.tokens[0].token}`)
    .send({
      location: "Kyiv"
    })
    .expect(400);
});
