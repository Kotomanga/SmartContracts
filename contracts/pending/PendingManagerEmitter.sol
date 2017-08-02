pragma solidity ^0.4.11;

import '../core/event/MultiEventsHistoryAdapter.sol';

contract PendingManagerEmitter is MultiEventsHistoryAdapter {
    event Confirmation(address indexed self, address indexed owner, bytes32 indexed hash);
    event Revoke(address indexed self, address indexed owner, bytes32 indexed hash);
    event Cancelled(address indexed self, bytes32 indexed hash);
    event Done(address indexed self, bytes32 indexed hash, bytes data, uint timestamp);
    event Error(address indexed self, uint errorCode);

    function emitConfirmation(address owner, bytes32 hash) {
        Confirmation(_self(), owner, hash);
    }

    function emitRevoke(address owner, bytes32 hash) {
        Revoke(_self(), owner, hash);
    }

    function emitCancelled(bytes32 hash) {
        Cancelled(_self(), hash);
    }

    function emitDone(bytes32 hash, bytes data, uint timestamp) {
        Done(_self(), hash, data, timestamp);
    }

    function emitError(uint errorCode) {
        Error(_self(), errorCode);
    }
}
