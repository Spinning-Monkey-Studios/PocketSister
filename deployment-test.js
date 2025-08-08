console.log("FORCED PRODUCTION TEST");
console.log("Environment:", process.env.NODE_ENV);
console.log("REPLIT_DEPLOYMENT:", process.env.REPLIT_DEPLOYMENT);
console.log("Arguments:", process.argv);
console.log("__filename:", __filename || "undefined");
process.exit(0);
