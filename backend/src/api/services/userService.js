const { getClient } = require("../../config/db");
const User = require("../models/User");

const UserService = {
  async authUser(provider, userData) {
    const client = await getClient();
    try {
      await client.query("BEGIN");

      let user = await User.findByOauthId(userData.authId, client);

      if (!user) {
        user = await User.create(provider, userData, client);
      }

      await client.query("COMMIT");
      return user;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err; // Re-throw so the controller knows the auth failed
    } finally {
      client.release();
    }
  },
};

module.exports = { UserService };
