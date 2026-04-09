const Collaboration = require('../models/Collaboration');

// GET /api/collaborations — returns requests relevant to the logged-in user
const getCollaborations = async (req, res) => {
  try {
    const query = req.user.role === 'investor'
      ? { investorId: req.user._id }
      : { entrepreneurId: req.user._id };

    const collaborations = await Collaboration.find(query)
      .populate('investorId', 'name email avatarUrl')
      .populate('entrepreneurId', 'name email avatarUrl startupName');

    res.json(collaborations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/collaborations — investor sends a request to entrepreneur
const createCollaboration = async (req, res) => {
  const { entrepreneurId, message } = req.body;
  try {
    if (req.user.role !== 'investor') {
      return res.status(403).json({ message: 'Only investors can send collaboration requests' });
    }

    const existing = await Collaboration.findOne({ investorId: req.user._id, entrepreneurId });
    if (existing) return res.status(400).json({ message: 'Request already sent to this entrepreneur' });

    const collaboration = await Collaboration.create({
      investorId: req.user._id,
      entrepreneurId,
      message,
    });

    res.status(201).json(collaboration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/collaborations/:id — entrepreneur accepts or rejects
const updateCollaborationStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) return res.status(404).json({ message: 'Request not found' });

    if (collaboration.entrepreneurId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    collaboration.status = status;
    await collaboration.save();
    res.json(collaboration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCollaborations, createCollaboration, updateCollaborationStatus };
