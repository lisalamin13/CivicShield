const express = require('express');
const router = express.Router();

const {submitGrievance, getGrievances, updateGrievanceStatus, deleteGrievance} = require('../controllers/grievanceController');
const { protect } = require('../middleware/authMiddleware');

// Handles creating a grievance (Student) and getting all grievances (Admin)
router.route('/')
    .post(protect, submitGrievance)
    .get(protect, getGrievances);

// Handles updating or deleting a specific grievance by its ID
router.route('/:id')
    .put(protect, updateGrievanceStatus)
    .delete(protect, deleteGrievance);

module.exports = router;