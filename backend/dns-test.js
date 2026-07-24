const dns = require("dns");

console.log("Before:", dns.getServers());

dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("After:", dns.getServers());

dns.resolveSrv("_mongodb._tcp.test1.wiiqrlj.mongodb.net", (err, records) => {
    console.log("Error:", err);
    console.log("Records:", records);
});