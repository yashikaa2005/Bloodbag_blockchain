// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract BloodChain {

    // =========================
    // ROLES
    // =========================

    enum Role {
        NONE,
        ADMIN,
        BLOOD_BANK,
        LAB,
        HOSPITAL
    }

    mapping(address => Role) public roles;

    address public admin;

    // =========================
    // BLOOD BAG STATUS
    // =========================

    enum Status {
        COLLECTED,
        TESTING,
        APPROVED,
        REJECTED,
        AVAILABLE,
        TRANSFERRED,
        RECEIVED,
        CONSUMED,
        EXPIRED
    }

    // =========================
    // BLOOD BAG STRUCTURE
    // =========================

    struct BloodBag {
        string bagId;
        string bloodGroup;
        uint256 collectionDate;
        uint256 expiryDate;
        Status status;
        address currentCustodian;
        bool exists;
    }

    // Blood Bag ID => Blood Bag
    mapping(string => BloodBag) private bloodBags;

    // =========================
    // HISTORY
    // =========================

    struct HistoryEntry {
        Status status;
        address actor;
        uint256 timestamp;
        string action;
    }

    mapping(string => HistoryEntry[]) private bloodBagHistory;

    // =========================
    // EVENTS
    // =========================

    event BloodBagRegistered(
        string indexed bagId,
        string bloodGroup,
        address indexed registeredBy,
        uint256 timestamp
    );

    event TestingStarted(
        string indexed bagId,
        address indexed lab,
        uint256 timestamp
    );

    event BloodBagApproved(
        string indexed bagId,
        address indexed lab,
        uint256 timestamp
    );

    event BloodBagRejected(
        string indexed bagId,
        address indexed lab,
        uint256 timestamp
    );

    event BloodBagTransferred(
        string indexed bagId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event BloodBagReceived(
        string indexed bagId,
        address indexed hospital,
        uint256 timestamp
    );

    event BloodBagConsumed(
        string indexed bagId,
        address indexed hospital,
        uint256 timestamp
    );

    event BloodBagExpired(
        string indexed bagId,
        address indexed actor,
        uint256 timestamp
    );

    event RoleAssigned(
        address indexed account,
        Role role
    );

    // =========================
    // MODIFIERS
    // =========================

    modifier onlyAdmin() {
        require(
            roles[msg.sender] == Role.ADMIN,
            "Only admin can perform this action"
        );
        _;
    }

    modifier onlyBloodBank() {
        require(
            roles[msg.sender] == Role.BLOOD_BANK,
            "Only blood bank can perform this action"
        );
        _;
    }

    modifier onlyLab() {
        require(
            roles[msg.sender] == Role.LAB,
            "Only lab can perform this action"
        );
        _;
    }

    modifier onlyHospital() {
        require(
            roles[msg.sender] == Role.HOSPITAL,
            "Only hospital can perform this action"
        );
        _;
    }

    // =========================
    // CONSTRUCTOR
    // =========================

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.ADMIN;
    }

    // =========================
    // ROLE MANAGEMENT
    // =========================

    function assignRole(
        address account,
        Role role
    ) external onlyAdmin {

        require(account != address(0), "Invalid address");
        require(role != Role.NONE, "Invalid role");

        roles[account] = role;

        emit RoleAssigned(account, role);
    }

    // =========================
    // REGISTER BLOOD BAG
    // =========================

    function registerBloodBag(
        string calldata bagId,
        string calldata bloodGroup,
        uint256 collectionDate,
        uint256 expiryDate
    ) external onlyBloodBank {

        require(
            !bloodBags[bagId].exists,
            "Blood bag already exists"
        );

        require(
            bytes(bagId).length > 0,
            "Invalid bag ID"
        );

        require(
            bytes(bloodGroup).length > 0,
            "Invalid blood group"
        );

        require(
            expiryDate > collectionDate,
            "Expiry must be after collection"
        );

        bloodBags[bagId] = BloodBag({
            bagId: bagId,
            bloodGroup: bloodGroup,
            collectionDate: collectionDate,
            expiryDate: expiryDate,
            status: Status.COLLECTED,
            currentCustodian: msg.sender,
            exists: true
        });

        _addHistory(
            bagId,
            Status.COLLECTED,
            msg.sender,
            "Blood bag registered"
        );

        emit BloodBagRegistered(
            bagId,
            bloodGroup,
            msg.sender,
            block.timestamp
        );
    }

    // =========================
    // START TESTING
    // =========================

    function startTesting(
        string calldata bagId
    ) external onlyLab {

        BloodBag storage bag = bloodBags[bagId];

        require(bag.exists, "Blood bag does not exist");
        require(
            bag.status == Status.COLLECTED,
            "Bag is not ready for testing"
        );

        bag.status = Status.TESTING;

        _addHistory(
            bagId,
            Status.TESTING,
            msg.sender,
            "Laboratory testing started"
        );

        emit TestingStarted(
            bagId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================
    // APPROVE BLOOD BAG
    // =========================

    function approveBloodBag(
        string calldata bagId
    ) external onlyLab {

        BloodBag storage bag = bloodBags[bagId];

        require(bag.exists, "Blood bag does not exist");
        require(
            bag.status == Status.TESTING,
            "Bag is not under testing"
        );

        bag.status = Status.APPROVED;

        _addHistory(
            bagId,
            Status.APPROVED,
            msg.sender,
            "Blood bag approved by laboratory"
        );

        // Automatically make it available after approval
        bag.status = Status.AVAILABLE;

        _addHistory(
            bagId,
            Status.AVAILABLE,
            msg.sender,
            "Blood bag made available"
        );

        emit BloodBagApproved(
            bagId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================
    // REJECT BLOOD BAG
    // =========================

    function rejectBloodBag(
        string calldata bagId
    ) external onlyLab {

        BloodBag storage bag = bloodBags[bagId];

        require(bag.exists, "Blood bag does not exist");
        require(
            bag.status == Status.TESTING,
            "Bag is not under testing"
        );

        bag.status = Status.REJECTED;

        _addHistory(
            bagId,
            Status.REJECTED,
            msg.sender,
            "Blood bag rejected by laboratory"
        );

        emit BloodBagRejected(
            bagId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================
    // TRANSFER BLOOD BAG
    // =========================

    function transferBloodBag(
        string calldata bagId,
        address recipient
    ) external {

        BloodBag storage bag = bloodBags[bagId];

        require(bag.exists, "Blood bag does not exist");

        require(
            bag.currentCustodian == msg.sender,
            "Only current custodian can transfer"
        );

        require(
            recipient != address(0),
            "Invalid recipient"
        );

        require(
            bag.status == Status.AVAILABLE ||
            bag.status == Status.RECEIVED,
            "Bag cannot be transferred in current state"
        );

        require(
            roles[recipient] == Role.HOSPITAL ||
            roles[recipient] == Role.BLOOD_BANK,
            "Recipient must be authorized"
        );

        // Check expiry
        require(
            block.timestamp < bag.expiryDate,
            "Blood bag has expired"
        );

        address previousCustodian = bag.currentCustodian;

        bag.currentCustodian = recipient;
        bag.status = Status.TRANSFERRED;

        _addHistory(
            bagId,
            Status.TRANSFERRED,
            msg.sender,
            "Blood bag transferred"
        );

        emit BloodBagTransferred(
            bagId,
            previousCustodian,
            recipient,
            block.timestamp
        );
    }

    // =========================
    // RECEIVE BLOOD BAG
    // =========================

    function receiveBloodBag(
        string calldata bagId
    ) external onlyHospital {

        BloodBag storage bag = bloodBags[bagId];

        require(bag.exists, "Blood bag does not exist");

        require(
            bag.currentCustodian == msg.sender,
            "Hospital is not the recipient"
        );

        require(
            bag.status == Status.TRANSFERRED,
            "Bag is not in transit"
        );

        require(
            block.timestamp < bag.expiryDate,
            "Blood bag has expired"
        );

        bag.status = Status.RECEIVED;

        _addHistory(
            bagId,
            Status.RECEIVED,
            msg.sender,
            "Hospital received blood bag"
        );

        emit BloodBagReceived(
            bagId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================
    // CONSUME BLOOD BAG
    // =========================

    function consumeBloodBag(
        string calldata bagId
    ) external onlyHospital {

        BloodBag storage bag = bloodBags[bagId];

        require(bag.exists, "Blood bag does not exist");

        require(
            bag.currentCustodian == msg.sender,
            "Only current hospital can consume"
        );

        require(
            bag.status == Status.RECEIVED,
            "Bag has not been received"
        );

        require(
            block.timestamp < bag.expiryDate,
            "Blood bag has expired"
        );

        bag.status = Status.CONSUMED;

        _addHistory(
            bagId,
            Status.CONSUMED,
            msg.sender,
            "Blood bag consumed"
        );

        emit BloodBagConsumed(
            bagId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================
    // EXPIRE BLOOD BAG
    // =========================

    function markExpired(
        string calldata bagId
    ) external {

        BloodBag storage bag = bloodBags[bagId];

        require(bag.exists, "Blood bag does not exist");

        require(
            block.timestamp >= bag.expiryDate,
            "Blood bag has not expired"
        );

        require(
            bag.status == Status.AVAILABLE ||
            bag.status == Status.RECEIVED ||
            bag.status == Status.TRANSFERRED,
            "Bag cannot be marked expired"
        );

        bag.status = Status.EXPIRED;

        _addHistory(
            bagId,
            Status.EXPIRED,
            msg.sender,
            "Blood bag expired"
        );

        emit BloodBagExpired(
            bagId,
            msg.sender,
            block.timestamp
        );
    }

    // =========================
    // GET BLOOD BAG
    // =========================

    function getBloodBag(
        string calldata bagId
    )
        external
        view
        returns (
            string memory,
            string memory,
            uint256,
            uint256,
            Status,
            address
        )
    {
        BloodBag memory bag = bloodBags[bagId];

        require(
            bag.exists,
            "Blood bag does not exist"
        );

        return (
            bag.bagId,
            bag.bloodGroup,
            bag.collectionDate,
            bag.expiryDate,
            bag.status,
            bag.currentCustodian
        );
    }

    // =========================
    // GET HISTORY
    // =========================

    function getBloodHistory(
        string calldata bagId
    )
        external
        view
        returns (HistoryEntry[] memory)
    {
        require(
            bloodBags[bagId].exists,
            "Blood bag does not exist"
        );

        return bloodBagHistory[bagId];
    }

    // =========================
    // INTERNAL HISTORY FUNCTION
    // =========================

    function _addHistory(
        string memory bagId,
        Status status,
        address actor,
        string memory action
    ) internal {

        bloodBagHistory[bagId].push(
            HistoryEntry({
                status: status,
                actor: actor,
                timestamp: block.timestamp,
                action: action
            })
        );
    }
}