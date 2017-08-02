var AssetsManager = artifacts.require("./AssetsManager.sol");
const Storage = artifacts.require('./Storage.sol');
const ProxyFactory = artifacts.require("./ProxyFactory.sol");
const StorageManager = artifacts.require("./StorageManager.sol");
const ContractsManager = artifacts.require("./ContractsManager.sol");
const ChronoBankPlatform = artifacts.require("./ChronoBankPlatform.sol");
const MultiEventsHistory = artifacts.require("./MultiEventsHistory.sol");

module.exports = function (deployer, network) {
    deployer.deploy(AssetsManager, Storage.address, 'AssetsManager')
        .then(() =>  StorageManager.deployed())
        .then(_storageManager => _storageManager.giveAccess(AssetsManager.address, 'AssetsManager'))
        .then(() => AssetsManager.deployed())
        .then(_manager => manager = _manager)
        .then(() => manager.init(ChronoBankPlatform.address, ContractsManager.address, ProxyFactory.address))
        .then(() => MultiEventsHistory.deployed())
        .then(_history => _history.authorize(manager.address))
        .then(() => console.log("[MIGRATION] [30] AssetManager: #done"))
}
