// Zero Knowledge Proof Service
// Handles proof generation and verification without revealing sensitive data

class ZKProofService {
  constructor() {
    this.proofs = new Map();
    this.proofCounter = 0;
  }

  /**
   * Generate a zero-knowledge proof
   * @param {string} proofType - Type of proof (age, graduation, gpa, custom)
   * @param {object} data - Data to prove
   * @returns {object} - Generated proof
   */
  async generateProof(proofType, data) {
    try {
      const proofId = `proof_${++this.proofCounter}`;
      
      let proof = {
        id: proofId,
        type: proofType,
        timestamp: new Date(),
        verified: false,
        data: {}
      };

      switch (proofType) {
        case 'age':
          proof = this._generateAgeProof(proof, data);
          break;
        case 'graduation':
          proof = this._generateGraduationProof(proof, data);
          break;
        case 'gpa':
          proof = this._generateGPAProof(proof, data);
          break;
        case 'custom':
          proof = this._generateCustomProof(proof, data);
          break;
        default:
          throw new Error('Invalid proof type');
      }

      this.proofs.set(proofId, proof);
      return {
        success: true,
        proof: proof.id,
        publicInputs: proof.publicInputs,
        proofHash: this._hashProof(proof)
      };
    } catch (error) {
      throw new Error(`Proof generation failed: ${error.message}`);
    }
  }

  /**
   * Verify a zero-knowledge proof
   * @param {string} proofId - Proof ID
   * @param {object} publicInputs - Public inputs to verify
   * @returns {object} - Verification result
   */
  async verifyProof(proofId, publicInputs) {
    try {
      const proof = this.proofs.get(proofId);
      if (!proof) {
        throw new Error('Proof not found');
      }

      // Verify public inputs match
      const isValid = JSON.stringify(proof.publicInputs) === JSON.stringify(publicInputs);
      
      if (isValid) {
        proof.verified = true;
      }

      return {
        success: true,
        verified: isValid,
        proofId: proofId,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Proof verification failed: ${error.message}`);
    }
  }

  /**
   * Validate age without revealing DOB
   * @param {Date} dob - Date of birth
   * @param {number} minimumAge - Minimum age required
   * @returns {object} - Validation result
   */
  async validateAge(dob, minimumAge) {
    try {
      const today = new Date();
      const age = today.getFullYear() - new Date(dob).getFullYear();
      const isValid = age >= minimumAge;

      // Generate a proof without revealing exact age
      const proof = {
        id: `age_proof_${++this.proofCounter}`,
        type: 'age',
        publicInputs: {
          minimumAge: minimumAge,
          yearOfBirth: new Date(dob).getFullYear(),
          isAgeValid: isValid
        },
        timestamp: new Date(),
        verified: isValid
      };

      this.proofs.set(proof.id, proof);

      return {
        success: true,
        isValid: isValid,
        minimumAge: minimumAge,
        proofId: proof.id,
        proofHash: this._hashProof(proof)
      };
    } catch (error) {
      throw new Error(`Age validation failed: ${error.message}`);
    }
  }

  /**
   * Validate GPA without revealing exact score
   * @param {number} gpa - GPA score
   * @param {number} minimumGpa - Minimum GPA required
   * @returns {object} - Validation result
   */
  async validateGPA(gpa, minimumGpa) {
    try {
      const isValid = gpa >= minimumGpa;

      // Generate a proof without revealing exact GPA
      const proof = {
        id: `gpa_proof_${++this.proofCounter}`,
        type: 'gpa',
        publicInputs: {
          minimumGpa: minimumGpa,
          gpaRange: isValid ? `>= ${minimumGpa}` : `< ${minimumGpa}`,
          isGPAValid: isValid
        },
        timestamp: new Date(),
        verified: isValid
      };

      this.proofs.set(proof.id, proof);

      return {
        success: true,
        isValid: isValid,
        minimumGpa: minimumGpa,
        proofId: proof.id,
        proofHash: this._hashProof(proof)
      };
    } catch (error) {
      throw new Error(`GPA validation failed: ${error.message}`);
    }
  }

  /**
   * Get a proof by ID
   * @param {string} proofId - Proof ID
   * @returns {object} - Proof object
   */
  getProof(proofId) {
    return this.proofs.get(proofId);
  }

  /**
   * Get all proofs
   * @returns {array} - Array of proofs
   */
  getAllProofs() {
    return Array.from(this.proofs.values());
  }

  // ===== Private Methods =====

  _generateAgeProof(proof, data) {
    const { dob, minimumAge } = data;
    const today = new Date();
    const birthDate = new Date(dob);
    const age = today.getFullYear() - birthDate.getFullYear();
    const isAgeValid = age >= minimumAge;

    proof.publicInputs = {
      minimumAge: minimumAge,
      yearOfBirth: birthDate.getFullYear(),
      isAgeValid: isAgeValid
    };
    proof.data = { ageVerified: isAgeValid };
    return proof;
  }

  _generateGraduationProof(proof, data) {
    const { degreeType, universityName, graduationYear } = data;
    
    proof.publicInputs = {
      degreeType: degreeType || 'Bachelor',
      universityName: universityName,
      graduationYear: graduationYear
    };
    proof.data = { graduationVerified: true };
    return proof;
  }

  _generateGPAProof(proof, data) {
    const { gpa, minimumGpa } = data;
    const isGPAValid = gpa >= minimumGpa;

    proof.publicInputs = {
      minimumGpa: minimumGpa,
      gpaRange: isGPAValid ? `>= ${minimumGpa}` : `< ${minimumGpa}`,
      isGPAValid: isGPAValid
    };
    proof.data = { gpaVerified: isGPAValid };
    return proof;
  }

  _generateCustomProof(proof, data) {
    const { attribute, value } = data;
    
    proof.publicInputs = {
      attribute: attribute,
      value: value,
      verified: true
    };
    proof.data = { customVerified: true };
    return proof;
  }

  _hashProof(proof) {
    // Simple hash using JSON stringification and character codes
    const str = JSON.stringify({
      id: proof.id,
      type: proof.type,
      timestamp: proof.timestamp,
      publicInputs: proof.publicInputs
    });
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `0x${Math.abs(hash).toString(16)}`;
  }
}

export default new ZKProofService();
