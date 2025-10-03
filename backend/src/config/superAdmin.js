import argon2 from "argon2";

// Hardwired SuperAdmin account (Zyntra internal)
export const superAdmin = {
  email: "superadmin@zyntra.com",
  // Replace this hash with a real Argon2 hash of your chosen password
  passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$uDQR3iLkQvdejMNRhXFH6Q$q1+JIbaVL9H0h8b1A5d29dYLoLiMMYjDWQESOynebrI",
  role: "superadmin"
};

// Utility: Verify SuperAdmin password
export async function verifySuperAdminPassword(password) {
  return await argon2.verify(superAdmin.passwordHash, password);
}

export default superAdmin;