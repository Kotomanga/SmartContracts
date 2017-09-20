const ChronoBankAssetProxy = artifacts.require('./ChronoBankAssetProxy.sol')
const Setup = require('../setup/setup');
const Reverter = require('./helpers/reverter');
const bytes32 = require('./helpers/bytes32');
const bytes32fromBase58 = require('./helpers/bytes32fromBase58');
const eventsHelper = require('./helpers/eventsHelper');
const ErrorsEnum = require("../common/errors");

contract('Assets Manager', function(accounts) {
  var owner = accounts[0];
  var owner1 = accounts[1];
  var owner2 = accounts[2];
  var owner3 = accounts[3];
  var owner4 = accounts[4];
  var owner5 = accounts[5];
  var nonOwner = accounts[6];
  var locController1 = accounts[7];
  var locController2 = accounts[7];
  var conf_sign;
  var conf_sign2;
  var conf_sign3;
  var txId;
  var watcher;
  var unix = Math.round(+new Date()/1000);

  const TIME_SYMBOL = 'TIME';
  const LHT_SYMBOL = 'LHT';
  const NAME = 'Time Token';
  const DESCRIPTION = 'ChronoBank Time Shares';
  const NAME2 = 'Labour-hour Token';
  const DESCRIPTION2 = 'ChronoBank Lht Assets';
  const BASE_UNIT = 2;
  const IS_REISSUABLE = true;
  const IS_NOT_REISSUABLE = false;
  const BALANCE_ETH = 1000;
  const fakeArgs = [0,0,0,0,0,0,0,0];

  before('setup', function(done) {

    Setup.setup(done);

  });

  context("initial tests", function() {
    it("Platform has correct TIME proxy address.", function() {
      return Setup.chronoBankPlatform.proxies(TIME_SYMBOL).then(function(r) {
        assert.equal(r,Setup.chronoBankAssetProxy.address);
      });
    });

    it("Platform has correct LHT proxy address.", function() {
      return Setup.chronoBankPlatform.proxies(LHT_SYMBOL).then(function(r) {
        assert.equal(r,Setup.chronoBankAssetWithFeeProxy.address);
      });
    });


    it("TIME contract has correct TIME proxy address.", function() {
      return Setup.chronoBankAsset.proxy().then(function(r) {
        assert.equal(r,Setup.chronoBankAssetProxy.address);
      });
    });

    it("LHT contract has correct LHT proxy address.", function() {
      return Setup.chronoBankAssetWithFee.proxy().then(function(r) {
        assert.equal(r,Setup.chronoBankAssetWithFeeProxy.address);
      });
    });

    it("TIME proxy has right version", function() {
      return Setup.chronoBankAssetProxy.getLatestVersion().then(function(r) {
        assert.equal(r,Setup.chronoBankAsset.address);
      });
    });

    it("LHT proxy has right version", function() {
      return Setup.chronoBankAssetWithFeeProxy.getLatestVersion().then(function(r) {
        assert.equal(r,Setup.chronoBankAssetWithFee.address);
      });
    });
  });

  context("CRUD test", function(){

    it("can issue new Asset", function() {
        const supplyValue = 1000000;
        console.log(Setup.assetsManager.address);
      return Setup.assetsManager.createAsset.call('TEST','TEST','TEST',supplyValue,2,true,false).then(function(r1) {
        return Setup.assetsManager.createAsset('TEST','TEST','TEST',supplyValue,2,true,false,{
          from: accounts[0],
          gas: 3000000
      }).then((tx) => {
          assert.equal(r1, ErrorsEnum.OK);
          const assetCreatedEvents = eventsHelper.extractEvents(tx, "AssetCreated")
          assert.notEqual(assetCreatedEvents.length, 0);
            const tokenAddress = assetCreatedEvents[0].args.token;
          return ChronoBankAssetProxy.at(tokenAddress).then(function(instance) {
            return instance.totalSupply().then(function(r2) {
              assert.equal(r2, supplyValue);
            });
          });
        });
      });
    });

    it("allow add TIME Asset", function() {
      return Setup.assetsManager.addAsset.call(Setup.chronoBankAssetProxy.address,'TIME', owner).then(function(r) {
        return Setup.assetsManager.addAsset(Setup.chronoBankAssetProxy.address,'TIME', owner, {
          from: accounts[0],
          gas: 3000000
        }).then(function(tx) {
          return Setup.assetsManager.getAssets.call().then(function(r2) {
            assert.equal(r,ErrorsEnum.OK);
            assert.equal(r2.length,2);
          });
        });
      });
    });

    it("doesn't allow add TIME Asset with LHT symbol", function() {
      return Setup.assetsManager.addAsset.call(Setup.chronoBankAssetProxy.address,'LHT', owner).then(function(r) {
        return Setup.assetsManager.addAsset(Setup.chronoBankAssetProxy.address,'LHT', owner, {
          from: accounts[0],
          gas: 3000000
        }).then(function(tx) {
          return Setup.assetsManager.getAssets.call().then(function(r2) {
            assert.equal(r,ErrorsEnum.ASSETS_NOT_A_PROXY);
            assert.equal(r2.length,2);
          });
        });
      });
    });

    it("doesn't allow to add LHT Asset with TIME symbol", function() {
      return Setup.assetsManager.addAsset.call(Setup.chronoBankAssetWithFeeProxy.address,'TIME', Setup.chronoMintWallet.address).then(function(r) {
        return Setup.assetsManager.addAsset(Setup.chronoBankAssetWithFeeProxy.address,'TIME', Setup.chronoMintWallet.address, {
          from: accounts[0],
          gas: 3000000
        }).then(function(tx) {
          return Setup.assetsManager.getAssets.call().then(function(r2) {
            assert.equal(r,ErrorsEnum.ASSETS_EXISTS);
            assert.equal(r2.length,2);
          });
        });
      });
    });

    it("allow add LHT Asset", function() {
      return Setup.assetsManager.addAsset.call(Setup.chronoBankAssetWithFeeProxy.address,bytes32('LHT'), Setup.chronoMintWallet.address).then(function(r) {
        return Setup.assetsManager.addAsset(Setup.chronoBankAssetWithFeeProxy.address,bytes32('LHT'), Setup.chronoMintWallet.address, {
          from: accounts[0],
          gas: 3000000
        }).then(function(tx) {
          return Setup.assetsManager.getAssets.call().then(function(r2) {
            assert.equal(r,ErrorsEnum.OK);
            assert.equal(r2.length,3);
          });
        });
      });
    });

    it("can provide TimeProxyContract address.", function() {
      return Setup.erc20Manager.getTokenAddressBySymbol.call('TIME').then(function(r) {
        assert.equal(r,Setup.chronoBankAssetProxy.address);
      });
    });

    it("can provide LHProxyContract address.", function() {
      return Setup.erc20Manager.getTokenAddressBySymbol.call('LHT').then(function(r) {
        assert.equal(r,Setup.chronoBankAssetWithFeeProxy.address);
      });
    });

    it("should show 1000000000000 TIME balance", function () {
      return Setup.assetsManager.getAssetBalance.call(bytes32('TIME')).then(function (r) {
        assert.equal(r, 1000000000000);
      });
    });

    it("should know owner as TIME owner", function () {
      return Setup.assetsManager.isAssetOwner.call(bytes32('TIME'),owner).then(function (r) {
        assert.equal(r, true);
      });
    });

    it("shouldn't know owner1 as TIME owner", function () {
      return Setup.assetsManager.isAssetOwner.call(bytes32('TIME'),owner1).then(function (r) {
        assert.equal(r, false);
      });
    });

    it("should show owners for asset by SYMBOL", function () {
      return Setup.assetsManager.getAssetOwners.call(bytes32('TIME')).then(function (r) {
        assert.equal(r[0], owner);
      });
    });

    it("should show assets symbol owner by address provided", function () {
      return Setup.assetsManager.getAssetsForOwner.call(owner).then(function (r) {
        assert.equal(r.length, 2);
      });
    });

    it("should be able to send 100 TIME to owner", function () {
      return Setup.assetsManager.sendAsset.call(bytes32('TIME'), owner, 100).then(function (r) {
        return Setup.assetsManager.sendAsset(bytes32('TIME'), owner, 100, {
          from: accounts[0],
          gas: 3000000
        }).then(function () {
          assert.isOk(r);
        });
      });
    });

    it("check Owner has 100 TIME", function () {
      return Setup.chronoBankAssetProxy.balanceOf.call(owner).then(function (r) {
        assert.equal(r, 100);
      });
    });

   /* it("should be able to send 1000 TIME to msg.sender", function () {
      return Setup.assetsManager.sendTime({from: owner2, gas: 3000000}).then(function () {
        return Setup.chronoBankAssetProxy.balanceOf.call(owner2).then(function (r) {
          assert.equal(r, 1000000000);
        });
      });
    });

    it("shouldn't be able to send 1000 TIME to msg.sender twice", function () {
      return Setup.assetsManager.sendTime({from: owner2, gas: 3000000}).then(function () {
        return Setup.chronoBankAssetProxy.balanceOf.call(owner2).then(function (r) {
          assert.equal(r, 1000000000);
        });
      });
    });*/

    it("should be able to send 100 TIME to owner1", function () {
      return Setup.assetsManager.sendAsset.call(TIME_SYMBOL, owner1, 100).then(function (r) {
        return Setup.assetsManager.sendAsset(TIME_SYMBOL, owner1, 100, {
          from: accounts[0],
          gas: 3000000
        }).then(function () {
          assert.isOk(r);
        });
      });
    });

    it("check Owner1 has 100 TIME", function () {
      return Setup.chronoBankAssetProxy.balanceOf.call(owner1).then(function (r) {
        assert.equal(r, 100);
      });
    });


  });
});
