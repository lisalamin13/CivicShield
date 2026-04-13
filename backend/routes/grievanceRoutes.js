const express = require('express');
const router = express.Router();

const {
    submitGrievance,
    getGrievances,
    updateGrievanceStatus,
    deleteGrievance
} = require('../controllers/grievanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const adminRoles = [
    'SuperAdmin',
    'SUPER_ADMIN',
    'OrgAdmin',
    'DeptHead',
    'Admin',
    'Investigator',
    'Compliance_Officer'
];

router.post('/submit', protect, submitGrievance);

router.route('/')
    .post(protect, submitGrievance)
    .get(protect, authorize(...adminRoles), getGrievances);

router.route('/:id')
    .put(protect, authorize(...adminRoles), updateGrievanceStatus)
    .delete(protect, authorize(...adminRoles), deleteGrievance);

module.exports = router;
