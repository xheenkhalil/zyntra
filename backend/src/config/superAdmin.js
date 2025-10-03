export const superAmin = {
  email: 
    process.env.SUPER_ADMIN_EMAIL || "superadmin@zyntra.com",
  password:
    process.env.SUPER_ADMIN_PASSWORD || " $argon2id$v=19$m=65536,t=3,p=4$BgHn51ZrsyoCt6miBieWWA$IP1aRnVHArOgN9B8Y/PkO+9U6c20SJMyYdXdZpBpFWQ ",
};
