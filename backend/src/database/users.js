require("dotenv").config();
const bcrypt = require("bcrypt");
const { getClient } = require("../config/db");

// Helper function to generate random data
function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Sample data
const firstNames = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Charles",
  "Karen",
  "Christopher",
  "Nancy",
  "Daniel",
  "Lisa",
  "Matthew",
  "Betty",
  "Anthony",
  "Margaret",
  "Mark",
  "Sandra",
  "Donald",
  "Ashley",
  "Steven",
  "Dorothy",
  "Paul",
  "Kimberly",
  "Andrew",
  "Emily",
  "Joshua",
  "Donna",
  "Kevin",
  "Michelle",
  "Brian",
  "Carol",
  "George",
  "Amanda",
  "Edward",
  "Melissa",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "Hall",
  "Wright",
  "Scott",
  "Green",
  "Baker",
  "Adams",
  "Nelson",
  "Carter",
  "Mitchell",
  "Perez",
  "Roberts",
  "Turner",
  "Phillips",
  "Campbell",
  "Parker",
];

const domains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "example.com",
];

const roles = ["VISITOR", "STAFF", "ADMIN"];

async function addRandomUsers(existingClient = null) {
  const client = await getClient();
  console.log("Adding 40 random users to the database...");

  try {
    // Use existing client if provided (when called from seed), otherwise create new connection
    const useExistingClient = existingClient !== null;

    // Test database connection first (only if not using existing client)
    if (!useExistingClient) {
      console.log("Testing database connection...");
      const testQuery = "SELECT NOW()";
      await client.query(testQuery);
      console.log("✅ Database connection successful");
    }

    // Get role IDs from the database
    console.log("Fetching roles from database...");
    const roleQuery = "SELECT id, name FROM roles WHERE name IN ($1, $2, $3)";
    const roleResult = await client.query(roleQuery, roles);

    if (roleResult.rows.length === 0) {
      console.error(
        "❌ No roles found in the database. Please ensure roles are seeded first.",
      );
      console.log("Available roles in the database:");
      const allRolesQuery = "SELECT name FROM roles";
      const allRolesResult = await client.query(allRolesQuery);
      console.log(allRolesResult.rows.map((row) => row.name));
      return;
    }

    const roleMap = {};
    roleResult.rows.forEach((role) => {
      roleMap[role.name] = role.id;
    });

    console.log("✅ Found roles:", roleMap);

    // Generate and insert 40 users
    const users = [];

    for (let i = 1; i <= 40; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(1, 999)}@${getRandomElement(domains)}`;
      const phone = `+1${getRandomNumber(200, 999)}${getRandomNumber(200, 999)}${getRandomNumber(1000, 9999)}`;
      const roleName = getRandomElement(roles);
      const roleId = roleMap[roleName];

      users.push({
        firstName,
        lastName,
        email,
        phone,
        roleId,
        roleName,
      });
    }

    // Insert users into the database
    console.log("Inserting users...");

    for (const user of users) {
      const insertQuery = `
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role_id, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING id, first_name, last_name, email, role_id
      `;

      // Use a simple password hash for testing (in production, use proper hashing)
      const passwordHash = await bcrypt.hash("password123", 12); // dummy hash for "password123"

      const result = await client.query(insertQuery, [
        user.firstName,
        user.lastName,
        user.email,
        user.phone,
        passwordHash,
        user.roleId,
        true, // is_active
      ]);

      console.log(
        `✅ Created user: ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.roleName}`,
      );
    }

    console.log("\n🎉 Successfully added 40 random users to the database!");

    // Show summary
    const countQuery = "SELECT COUNT(*) as total FROM users";
    const countResult = await client.query(countQuery);
    console.log(`📊 Total users in the database: ${countResult.rows[0].total}`);

    // Show role distribution
    const roleCountQuery = `
      SELECT r.name, COUNT(u.id) as user_count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      GROUP BY r.name
      ORDER BY user_count DESC
    `;
    const roleCountResult = await client.query(roleCountQuery);
    console.log("\n📈 Users by role:");
    roleCountResult.rows.forEach((row) => {
      console.log(`   ${row.name}: ${row.user_count} users`);
    });
  } catch (error) {
    console.error("❌ Error adding users:", error.message);
    console.error("Full error:", error);
  }
}

// Export the function to be called from seed
addRandomUsers();
