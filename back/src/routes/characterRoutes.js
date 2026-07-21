const Character = require("../models/Character");

async function routes(fastify, options) {
  fastify.post("/new_character", async (request, reply) => {
    try {
      const character = await Character.create(request.body);
      reply.send(character);
    } catch (error) {
      reply.status(500).send(error);
    }
  });


}

module.exports = routes;
