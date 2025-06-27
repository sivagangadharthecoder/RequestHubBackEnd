const getUserData = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      userData: {
        _id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        email: user.email,
        isAccountVerified: user.isAccountVerified
      }
    });
  } catch (err) {
    console.error('Error in getUserData:', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export default getUserData;