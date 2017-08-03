pragma solidity ^0.4.11;

import "./Vote.sol";
import "./VoteActorEmitter.sol";
import {TimeHolderInterface as TimeHolder} from "../timeholder/TimeHolderInterface.sol";
import "../core/common/ListenerInterface.sol";

contract VoteActor is Vote, VoteActorEmitter, ListenerInterface {

    function VoteActor(Storage _store, bytes32 _crate) Vote(_store, _crate) {
    }

    function init(address _contractsManager) onlyContractOwner returns (uint) {
        BaseManager.init(_contractsManager, "VoteActor");
        return OK;
    }

    //function for user vote. input is a string choice
    function vote(uint _pollId, uint _choice) returns (uint errorCode) {
        if (!store.get(status, _pollId)) {
            return _emitError(ERROR_VOTE_POLL_WRONG_STATUS);
        }

        if (!store.get(active, _pollId)) {
            return _emitError(ERROR_VOTE_POLL_INACTIVE);
        }

        address timeHolder = lookupManager("TimeHolder");
        uint balance = TimeHolder(timeHolder).depositBalance(msg.sender);

        if (balance == 0) {
            return _emitError(ERROR_VOTE_POLL_NO_SHARES);
        }

        if (store.get(memberOption, _pollId, msg.sender) != 0) {
            return _emitError(ERROR_VOTE_POLL_ALREADY_VOTED);
        }

        uint optionsValue = store.get(options, _pollId, _choice) + balance;
        store.set(options, _pollId, _choice, optionsValue);
        store.set(memberVotes, _pollId, msg.sender, balance);
        store.add(members, bytes32(_pollId), msg.sender);
        store.set(memberOption, _pollId, msg.sender, _choice);
        store.add(memberPolls, bytes32(msg.sender), _pollId);
        _emitVoteCreated(_choice, _pollId);
        // if votelimit reached, end poll
        uint voteLimitNumber = store.get(votelimit, _pollId);
        if (optionsValue >= voteLimitNumber && (voteLimitNumber > 0 || store.get(deadline, _pollId) <= now)) {
            endPoll(_pollId);
        }
        return OK;
    }

    //TimeHolder interface implementation
    modifier onlyTimeHolder() {
        if (msg.sender == lookupManager("TimeHolder")) {
            _;
        }
    }

    function deposit(address _address, uint _amount, uint _total) onlyTimeHolder returns (uint) {
        StorageInterface.Iterator memory memberPollsIterator = store.listIterator(memberPolls, bytes32(_address));
        while (store.canGetNextWithIterator(memberPolls, memberPollsIterator)) {
            uint pollId = store.getNextWithIterator(memberPolls, memberPollsIterator);
            if (store.get(status, pollId) && store.get(active, pollId)) {
                uint choice = store.get(memberOption, pollId, _address);
                uint value = store.get(options, pollId, choice);
                value = value + _amount;
                store.set(memberVotes, pollId, _address, _total);
                store.set(options, pollId, choice, value);
            }
            uint voteLimitNumber = store.get(votelimit, pollId);
            if (value >= voteLimitNumber && (voteLimitNumber > 0 || store.get(deadline, pollId) <= now)) {
                endPoll(pollId);
            }
        }
        return OK;
    }

    function withdrawn(address _address, uint _amount, uint _total) onlyTimeHolder returns (uint) {
        StorageInterface.Iterator memory memberPollsIterator = store.listIterator(memberPolls, bytes32(_address));
        while (store.canGetNextWithIterator(memberPolls, memberPollsIterator)) {
            uint pollId = uint(store.getNextWithIterator(memberPolls, memberPollsIterator));

            if (store.get(status, pollId) && store.get(active, pollId)) {
                uint choice = store.get(memberOption, pollId, _address);
                uint value = store.get(options, pollId, choice);
                value = value - _amount;
                store.set(memberVotes, pollId, _address, _total);
                store.set(options, pollId, choice, value);
                if (_total == 0) {
                    removeMember(pollId, _address);
                }
            }
        }
        return OK;
    }

    function removeMember(uint _pollId, address _address) internal {
        store.set(memberOption, _pollId, _address, 0);
        store.set(memberVotes, _pollId, _address, 0);
        store.remove(memberPolls, bytes32(_address), _pollId);
        store.remove(members, bytes32(_pollId), _address);
    }

    function _emitError(uint error) internal returns (uint) {
        VoteActor(getEventsHistory()).emitError(error );
        return error;
    }

    function _emitVoteCreated(uint choice, uint pollId) internal {
        VoteActor(getEventsHistory()).emitVoteCreated(choice, pollId);
    }
}
