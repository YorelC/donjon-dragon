const fastify = require("fastify")({ logger: true });
const sequelize = require("./config/database");
const characterRoutes = require("./routes/characterRoutes");

// Test de la connexion à la base de données
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected.")
    sequelize.sync({ force: true })
  })
  .catch((err) => console.log("Error: " + err));

// Enregistrement des routes
fastify.register(characterRoutes);

// Démarrage du serveur

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log(`server listening on ${fastify.server.address().port}`);
});
