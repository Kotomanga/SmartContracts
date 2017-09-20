var ProxyFactory = artifacts.require("./ProxyFactory.sol");

module.exports = function (deployer, network) {
    deployer.deploy(ProxyFactory)
        .then(() => console.log("[MIGRATION] [24] ProxyFactory: #done"))
}
