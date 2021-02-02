// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');

// Smart contracts
const AddressArrayLibMock = artifacts.require("./mock/util/AddressArrayLibMock.sol");

contract('AddressArrayLibTest', function (accounts) {

    const mapIndexes = (accounts, indexes) => indexes.map( index => accounts[index]);

    withData({
        _1_basic: [[], 0, [0], false, undefined],
        _2_basic: [[0, 1], 2, [0, 1, 2], false, undefined],
        _3_basic_equal_item: [[0, 1], 1, [0, 1, 1], false, undefined],
        _4_empty_item: [[0, 1], -1, [0, 1], true, 'EMPTY_ADDRESS_NOT_ALLOWED'],
        _5_empty_item: [[0, 1, 3, 6], 0, [0, 1, 3, 6, 0], false, undefined],
    }, function(initialIndexesList, newItemIdex, expectedIndexes, mustFail, expectedErrorMessage) {
        it(t('user', 'add', 'Should be able (or not) to add a new item.', mustFail), async function() {
            // Setup
            const addresses = mapIndexes(accounts, initialIndexesList);
            const expectedAddresses = mapIndexes(accounts, expectedIndexes);
            const newItem = newItemIdex === -1 ? NULL_ADDRESS : accounts[newItemIdex];
            const instance = await AddressArrayLibMock.new(addresses);

            try{
                // Invocation
                const txResult = await instance.add(newItem);
                            
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(txResult);
                
                const result = await instance.getResult();

                assert.equal(result.length, expectedAddresses.length);
                for (const item of result) {
                    assert(expectedAddresses.includes(item));
                }
                for (const item of expectedAddresses) {
                    assert(result.includes(item));
                }
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [[0, 1], 0, [1], false, undefined],
        _2_basic: [[0, 1, 2, 3], 2, [0, 1, 3], false, undefined],
        _3_basic_equal_item: [[0, 1, 0, 2, 3], 0, [1, 0, 2, 3], false, undefined],
        _4_basic_equal_item_2: [[1, 0, 2, 0, 3], 0, [1, 2, 0, 3], false, undefined],
        _5_empty_list: [[], 1, [], false, undefined],
        _6_valid_empty_item: [[0, 1, 2, 3], -1, [0, 1, 2, 3], false, undefined],
    }, function(initialIndexesList, removeItemIdex, expectedIndexes, mustFail, expectedErrorMessage) {
        it(t('user', 'remove', 'Should be able to remove an item.', mustFail), async function() {
            // Setup
            const addresses = mapIndexes(accounts, initialIndexesList);
            const expectedAddresses = mapIndexes(accounts, expectedIndexes);
            const newItem = removeItemIdex === -1 ? NULL_ADDRESS : accounts[removeItemIdex];
            const instance = await AddressArrayLibMock.new(addresses);

            try{
                // Invocation
                const txResult = await instance.remove(newItem);
                            
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(txResult);
                
                const result = await instance.getResult();

                assert.equal(result.length, expectedAddresses.length);
                for (const item of result) {
                    assert(expectedAddresses.includes(item));
                }
                for (const item of expectedAddresses) {
                    assert(result.includes(item));
                }
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [[0, 1], 0, [1], false, undefined],
        _2_basic: [[0, 1, 2, 3], 2, [0, 1, 3], false, undefined],
        _3_basic_equal_item: [[0, 1, 0, 2, 3], 0, [1, 0, 2, 3], false, undefined],
        _4_basic_equal_item_2: [[1, 0, 2, 0, 3], 1, [1, 2, 0, 3], false, undefined],
        _5_empty_list: [[], 1, [], false, undefined],
        _6_invalid_index: [[0, 1, 2, 3], -1, [0, 1, 2, 3], false, undefined],
        _7_invalid_index_2: [[0, 1, 2, 3], 5, [0, 1, 2, 3], false, undefined],
        _8_valid_last_index: [[0, 1, 2, 3], 3, [0, 1, 2], false, undefined],
    }, function(initialIndexesList, removeItemIdex, expectedIndexes, mustFail, expectedErrorMessage) {
        it(t('user', 'removeAt', 'Should be able to remove a item at an index.', mustFail), async function() {
            // Setup
            const addresses = mapIndexes(accounts, initialIndexesList);
            const expectedAddresses = mapIndexes(accounts, expectedIndexes);
            const instance = await AddressArrayLibMock.new(addresses);

            try{
                // Invocation
                const txResult = await instance.removeAt(removeItemIdex);
                            
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(txResult);
                
                const result = await instance.getResult();

                assert.equal(result.length, expectedAddresses.length);
                for (const item of result) {
                    assert(expectedAddresses.includes(item));
                }
                for (const item of expectedAddresses) {
                    assert(result.includes(item), `Item ${item} is not ${result}`);
                }
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_basic: [[0, 1], 0, true, 0],
        _2_multiple: [[1, 0, 2, 3, 0, 6], 0, true, 1],
        _3_multiple: [[1, 2, 3, 4, 5, 6, 7], 4, true, 3],
        _4_not_found: [[1, 2, 3, 4, 5, 6, 7], 8, false, 7],
    }, function(initialIndexesList, getItemIndex, expectedFound, expectedIndex) {
        it(t('user', 'getIndex', 'Should be able to get an index.', false), async function() {
            // Setup
            const addresses = mapIndexes(accounts, initialIndexesList);
            const getItem = getItemIndex === -1 ? NULL_ADDRESS : accounts[getItemIndex];
            const instance = await AddressArrayLibMock.new(addresses);

            // Invocation
            const result = await instance.getIndex(getItem);
                        
            // Assertions
            assert(result);
            assert.equal(result.indexAt.toString(), expectedIndex.toString());
            assert.equal(result.found.toString(), expectedFound.toString());
        });
    });
});