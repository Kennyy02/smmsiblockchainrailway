// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Smart contract for registering and verifying educational certificates on Polygon blockchain
 * @notice This contract stores certificate hashes and allows public verification
 */
contract CertificateRegistry {
    // Mapping: certificate_number => CertificateData
    mapping(string => CertificateData) public certificates;
    
    // Mapping: certificate_number => block timestamp
    mapping(string => uint256) public issueDates;
    
    // Array to track all registered certificate numbers
    string[] public certificateNumbers;
    
    // Events
    event CertificateRegistered(
        string indexed certificateNumber,
        bytes32 indexed hash,
        address indexed issuer,
        uint256 timestamp
    );
    
    event CertificateVerified(
        string indexed certificateNumber,
        bytes32 hash,
        bool isValid
    );
    
    // Struct to store certificate data
    struct CertificateData {
        bytes32 hash;
        address issuer;
        uint256 timestamp;
        bool exists;
    }
    
    /**
     * @dev Register a certificate on the blockchain
     * @param certificateNumber The unique certificate number
     * @param hash The SHA-256 hash of the certificate data
     */
    function registerCertificate(string memory certificateNumber, bytes32 hash) public {
        require(certificates[certificateNumber].exists == false, "Certificate already exists");
        require(hash != bytes32(0), "Invalid hash");
        
        certificates[certificateNumber] = CertificateData({
            hash: hash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        issueDates[certificateNumber] = block.timestamp;
        certificateNumbers.push(certificateNumber);
        
        emit CertificateRegistered(certificateNumber, hash, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify a certificate by checking if the hash matches
     * @param certificateNumber The certificate number to verify
     * @param hash The hash to verify against
     * @return isValid True if the certificate exists and hash matches
     */
    function verifyCertificate(string memory certificateNumber, bytes32 hash) public view returns (bool) {
        CertificateData memory cert = certificates[certificateNumber];
        
        if (!cert.exists) {
            return false;
        }
        
        bool isValid = cert.hash == hash;
        
        // Note: Cannot emit events in view functions
        // Events are only emitted in state-changing functions
        
        return isValid;
    }
    
    /**
     * @dev Get certificate data
     * @param certificateNumber The certificate number
     * @return hash The stored hash
     * @return issuer The address that registered the certificate
     * @return timestamp The block timestamp when registered
     * @return exists Whether the certificate exists
     */
    function getCertificate(string memory certificateNumber) public view returns (
        bytes32 hash,
        address issuer,
        uint256 timestamp,
        bool exists
    ) {
        CertificateData memory cert = certificates[certificateNumber];
        return (cert.hash, cert.issuer, cert.timestamp, cert.exists);
    }
    
    /**
     * @dev Get total number of registered certificates
     * @return count The total count
     */
    function getTotalCertificates() public view returns (uint256) {
        return certificateNumbers.length;
    }
    
    /**
     * @dev Check if a certificate exists
     * @param certificateNumber The certificate number to check
     * @return exists True if certificate exists
     */
    function certificateExists(string memory certificateNumber) public view returns (bool) {
        return certificates[certificateNumber].exists;
    }
}

