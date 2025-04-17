import React, { useState, useEffect } from 'react';
import { addUser } from '../utils/api';

const AddUserForm = ({ onUserAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    interests: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [animation, setAnimation] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  // Generate ID when name changes
  useEffect(() => {
    if (formData.name) {
      // Create ID from name (lowercase, no spaces) plus timestamp
      const namePart = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10);
      const timestamp = Date.now().toString().substring(9, 13);
      setGeneratedId(`${namePart}${timestamp}`);
    } else {
      setGeneratedId('');
    }
  }, [formData.name]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addInterest = (interest) => {
    if (!interest.trim()) return;
    
    const currentInterests = formData.interests ? 
      formData.interests.split(',').map(i => i.trim()).filter(i => i !== '') : 
      [];
    
    if (!currentInterests.includes(interest.trim())) {
      const newInterests = [...currentInterests, interest.trim()].join(', ');
      setFormData({
        ...formData,
        interests: newInterests
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!formData.name) {
      setError('Name is a required field');
      setAnimation(true);
      setTimeout(() => setAnimation(false), 820);
      return;
    }

    try {
      setLoading(true);
      const result = await addUser({
        ...formData,
        id: generatedId,
        age: formData.age ? parseInt(formData.age) : undefined,
        interests: formData.interests ? formData.interests.split(',').map(i => i.trim()).filter(Boolean) : []
      });
      
      if (result.success) {
        setSuccess(`User ${formData.name} added successfully!`);
        setFormData({
          name: '',
          age: '',
          interests: ''
        });
        
        // Notify parent component
        if (onUserAdded) {
          onUserAdded(result.user);
        }
      } else {
        setError(result.message || 'Failed to add user');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the user');
    } finally {
      setLoading(false);
    }
  };

  // Example interests for quick add
  const sampleInterests = [
    'Technology', 'Sports', 'Art', 'Music', 
    'Travel', 'Food', 'Reading', 'Gaming'
  ];

  return (
    <div className="card" style={{ 
      position: 'relative',
      padding: '25px',
      borderRadius: '8px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      backgroundColor: 'white',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '5px',
        background: 'linear-gradient(to right, #BEAA81, #1F2B3B)'
      }}></div>
      
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .submit-btn {
            background: linear-gradient(to right, var(--color-beige), var(--color-dark-blue));
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(31, 43, 59, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            margin-top: 10px;
          }
          
          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(31, 43, 59, 0.3);
          }
          
          .submit-btn:active:not(:disabled) {
            transform: translateY(1px);
            box-shadow: 0 3px 8px rgba(31, 43, 59, 0.2);
          }
          
          .submit-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          .interest-chip {
            display: inline-block;
            background-color: #f1f1f1;
            color: #555;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            margin-right: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid transparent;
          }
          
          .interest-chip:hover {
            background-color: #e9e9e9;
            border-color: var(--color-beige);
            color: var(--color-dark-blue);
          }
          
          .animated-input {
            animation: ${animation ? 'shake 0.8s' : 'none'};
          }
          
          .form-input {
            width: 100%;
            padding: 12px 15px;
            border-radius: 8px;
            border: 1px solid #e1e1e1;
            font-size: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            transition: all 0.3s ease;
          }
          
          .form-input:focus {
            border-color: var(--color-beige);
            box-shadow: 0 0 0 3px rgba(190, 170, 129, 0.2);
            outline: none;
          }
          
          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
            font-size: 0.95rem;
          }
          
          .success-message {
            opacity: 0;
            animation: fadeIn 0.5s forwards;
            background-color: rgba(76, 175, 80, 0.1);
            border: 1px solid rgba(76, 175, 80, 0.3);
            color: #43a047;
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 20px;
            display: flex;
            align-items: center;
          }
          
          .error-message {
            opacity: 0;
            animation: fadeIn 0.5s forwards;
            background-color: rgba(255, 82, 82, 0.1);
            border: 1px solid rgba(255, 82, 82, 0.3);
            color: #ff5252;
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 20px;
            display: flex;
            align-items: center;
          }
          
          .interest-container {
            display: flex;
            flex-wrap: wrap;
            margin-top: 10px;
          }
        `}
      </style>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: 'var(--color-beige)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h2 style={{ 
          margin: 0, 
          color: 'var(--color-dark-blue)',
          fontSize: '1.4rem',
          fontWeight: '600'
        }}>Add New User</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label" htmlFor="name">
            Full Name:
          </label>
          <input
            className={`form-input ${animation ? 'animated-input' : ''}`}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter user's full name"
            autoComplete="off"
          />
        </div>
        
        {generatedId && (
          <div style={{ 
            marginBottom: '20px',
            padding: '12px 15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '1px dashed #ddd'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ 
                fontSize: '0.85rem', 
                color: '#666',
                fontWeight: '500'
              }}>
                Auto-generated ID:
              </span>
              <span style={{ 
                backgroundColor: 'var(--color-dark-blue)',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                letterSpacing: '0.5px'
              }}>
                {generatedId}
              </span>
            </div>
            <div style={{ 
              fontSize: '0.8rem',
              color: '#888',
              marginTop: '8px',
              fontStyle: 'italic'
            }}>
              ID is automatically generated based on the name and time
            </div>
          </div>
        )}
        
        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label className="form-label" htmlFor="age">
            Age:
          </label>
          <input
            className="form-input"
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter user's age"
            min="1"
            max="120"
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label className="form-label" htmlFor="interests">
            Interests:
          </label>
          <input
            className="form-input"
            type="text"
            id="interests"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
            placeholder="Technology, Sports, Art..."
          />
          <div style={{ 
            fontSize: '0.8rem',
            color: '#777',
            marginTop: '6px'
          }}>
            Separate multiple interests with commas
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#666',
            marginBottom: '8px'
          }}>
            Quick add interests:
          </div>
          <div className="interest-container">
            {sampleInterests.map(interest => (
              <div 
                key={interest}
                className="interest-chip"
                onClick={() => addInterest(interest)}
              >
                {interest}
              </div>
            ))}
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={loading} 
          className="submit-btn"
        >
          {loading ? (
            <>
              <div style={{ 
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                animation: 'spin 1s linear infinite',
                marginRight: '10px'
              }}></div>
              Adding User...
            </>
          ) : (
            <>
              Add User
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '10px' }}>
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </>
          )}
        </button>
        
        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            {success}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddUserForm; 