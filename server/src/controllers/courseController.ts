import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Course, Watchlist } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const { studyType, faculty, timeShift, search, page = 1, limit = 100 } = req.query;

    const where: any = {};

    // Study Type filter
    if (studyType) {
      // Accept both forms of postgraduate
      if (studyType === 'دراسات عليا' || studyType === 'الدراسات العليا') {
        where[Op.or] = [
          { studyType: 'دراسات عليا' },
          { studyType: 'الدراسات العليا' }
        ];
      } else {
        where.studyType = studyType;
      }
    }

    // Faculty filter - applies differently based on study type
    if (faculty && faculty !== '' && faculty !== 'الكل') {
      if (studyType === 'دراسات عليا' || studyType === 'الدراسات العليا') {
        // For graduate: faculty dropdown contains program types (ماجستير/دبلوم عالي)
        // These map to the timeShift field in the database
        where.timeShift = faculty;
      } else {
        // For bachelor: faculty is the actual faculty name
        where.faculty = faculty;
      }
    }

    // Time Shift filter - only for bachelor's
    if (timeShift && timeShift !== '' && timeShift !== 'الكل' && studyType === 'بكالوريوس') {
      where.timeShift = timeShift;
    }

    // Text search filter
    if (search) {
      where[Op.or] = [
        { courseName: { [Op.iLike]: `%${search}%` } },
        { courseCode: { [Op.iLike]: `%${search}%` } },
        { instructor: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Course.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [
        ['faculty', 'ASC'],
        ['courseCode', 'ASC'],
        ['section', 'ASC'],
      ],
    });

    // Add isWatching flag and watchlistId to each course
    let coursesWithWatchStatus: any[] = rows;
    if (req.user) {
      // Get user's watchlist (include id for removal)
      const userWatchlist = await Watchlist.findAll({
        where: { userId: req.user.id },
        attributes: ['id', 'courseCode', 'section']
      });
      
      // Create a Map for fast lookup (courseCode_section -> watchlistId)
      const watchedCourses = new Map(
        userWatchlist.map(w => [`${w.courseCode}_${w.section}`, w.id])
      );
      
      // Add isWatching flag and watchlistId to each course
      coursesWithWatchStatus = rows.map(course => {
        const courseJson = course.toJSON();
        const key = `${course.courseCode}_${course.section}`;
        const watchlistId = watchedCourses.get(key);
        return {
          ...courseJson,
          isWatching: watchlistId !== undefined,
          watchlistId: watchlistId || null
        };
      });
    } else {
      // If not authenticated, set isWatching to false for all courses
      coursesWithWatchStatus = rows.map(course => {
        const courseJson = course.toJSON();
        return {
          ...courseJson,
          isWatching: false
        };
      });
    }

    const openCount = await Course.count({ where: { ...where, isOpen: true } });
    const closedCount = await Course.count({ where: { ...where, isOpen: false } });

    res.json({
      success: true,
      data: {
        courses: coursesWithWatchStatus,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
        stats: {
          total: count,
          open: openCount,
          closed: closedCount,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const total = await Course.count();
    const open = await Course.count({ where: { isOpen: true } });
    const closed = await Course.count({ where: { isOpen: false } });
    const bachelor = await Course.count({ where: { studyType: 'بكالوريوس' } });
    const graduate = await Course.count({ 
      where: { 
        [Op.or]: [
          { studyType: 'دراسات عليا' },
          { studyType: 'الدراسات العليا' }
        ]
      } 
    });

    res.json({
      success: true,
      data: {
        total,
        open,
        closed,
        bachelor,
        graduate,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFaculties = async (req: Request, res: Response) => {
  try {
    const { studyType } = req.query;

    const where: any = {};
    if (studyType) {
      where.studyType = studyType;
    }

    const faculties = await Course.findAll({
      attributes: ['faculty'],
      where,
      group: ['faculty'],
      raw: true,
    });

    const uniqueFaculties = [...new Set(faculties.map((f: any) => f.faculty))];

    res.json({ success: true, data: uniqueFaculties });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get available filter options based on what's actually in the database.
 * Returns faculties, time shifts, and programs dynamically.
 */
export const getFilterOptions = async (req: Request, res: Response) => {
  try {
    const { studyType, faculty } = req.query;

    // Get distinct faculties for the selected study type
    const facultyWhere: any = {};
    if (studyType) {
      facultyWhere.studyType = studyType;
    }

    const facultiesResult = await Course.findAll({
      attributes: ['faculty'],
      where: facultyWhere,
      group: ['faculty'],
      order: [['faculty', 'ASC']],
      raw: true,
    });
    const faculties = facultiesResult.map((f: any) => f.faculty);

    // Get distinct time shifts for the selected study type and faculty
    const timeShiftWhere: any = {};
    if (studyType) {
      timeShiftWhere.studyType = studyType;
    }
    if (faculty && studyType !== 'دراسات عليا' && studyType !== 'الدراسات العليا') {
      timeShiftWhere.faculty = faculty;
    }

    const timeShiftsResult = await Course.findAll({
      attributes: ['timeShift'],
      where: timeShiftWhere,
      group: ['timeShift'],
      order: [['timeShift', 'ASC']],
      raw: true,
    });
    const timeShifts = timeShiftsResult.map((t: any) => t.timeShift).filter(Boolean);

    // For graduate studies, get programs (stored in timeShift field)
    let programs: string[] = [];
    if (studyType === 'دراسات عليا' || studyType === 'الدراسات العليا') {
      const programsResult = await Course.findAll({
        attributes: ['timeShift'],
        where: { 
          [Op.or]: [
            { studyType: 'دراسات عليا' },
            { studyType: 'الدراسات العليا' }
          ]
        },
        group: ['timeShift'],
        order: [['timeShift', 'ASC']],
        raw: true,
      });
      programs = programsResult.map((p: any) => p.timeShift).filter(Boolean);
    }

    res.json({
      success: true,
      data: {
        faculties,
        timeShifts,
        programs,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
