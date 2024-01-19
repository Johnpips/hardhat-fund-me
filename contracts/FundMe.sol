// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "contracts/PriceConverter.sol";

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;

    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmt;

    address private immutable i_owner;

    error FundMe__NotOwner();

    AggregatorV3Interface private s_priceFeed;

    modifier OnlyOwner() {
        //require(msg.sender == i_owner, "sender is not owner"); 0R
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    function fund() public payable {
        uint256 ethPrice = msg.value.getConversionRate(s_priceFeed);
        require(ethPrice >= MINIMUM_USD, "Didn't send enough gas");
        s_funders.push(msg.sender);
        s_addressToAmt[msg.sender] = msg.value;
    }

    function withdraw() public OnlyOwner {
        // starting Index; ending Index; step index
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmt[funder] = 0;
        }

        // RESET AN ARRAY
        s_funders = new address[](0);

        //transfer
        //payable(msg.sender).transfer(address(this).balance);

        //send
        //bool sendSuccess = payable (msg.sender).send(address(this).balance);
        //require(sendSuccess, "send failed");

        //call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    function cheaperWithdraw() public payable OnlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmt[funder] = 0;
        }

        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmt(address funder) public view returns (uint256) {
        return s_addressToAmt[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
