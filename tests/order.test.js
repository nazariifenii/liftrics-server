const request = require("supertest");
const Order = require("../server/models/order");
const { server } = require("../server/app");

const { testUserId, testUser, configureDatabase } = require("./fixtures/db");

beforeEach(configureDatabase);

test("Should create order", async () => {
  const response = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${testUser.tokens[0].token}`)
    .send({
      primaryStreet: "primaryStreet",
      destinationStreet: "destinationStreet",
      primaryCity: "primaryCity",
      destinationCity: "detimationCity"
    })
    .expect(201);

  const order = await Order.findById(response.body._id);
  expect(order).not.toBeNull();
});
