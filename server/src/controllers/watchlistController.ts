import { Response } from 'express';
import { Watchlist, Course, Notification } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const watchlist = await Watchlist.findAll({
      where: { userId: req.user!.id },
      order: [['addedAt', 'DESC']],
    });

    const enriched = await Promise.all(
      watchlist.map(async (item) => {
        const course = await Course.findOne({
          where: { courseCode: item.courseCode, section: item.section },
        });

        return {
          ...item.toJSON(),
          currentStatus: course?.isOpen ? 'Open' : 'Closed',
          currentRoom: course?.room,
          currentTime: course?.time,
          currentDays: course?.days,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const { courseCode, section, courseName, faculty, instructor, notifyOnOpen, notifyOnClose, notifyOnSimilarCourse, notifyByEmail, notifyByWeb, notifyByPhone } = req.body;

    const existing = await Watchlist.findOne({
      where: { userId: req.user!.id, courseCode, section },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Course already in watchlist' });
    }

    const watchlist = await Watchlist.create({
      userId: req.user!.id,
      courseCode,
      section,
      courseName,
      faculty,
      instructor,
      notifyOnOpen: notifyOnOpen !== undefined ? notifyOnOpen : true,
      notifyOnClose: notifyOnClose !== undefined ? notifyOnClose : false,
      notifyOnSimilarCourse: notifyOnSimilarCourse !== undefined ? notifyOnSimilarCourse : true,
      notifyByEmail: notifyByEmail !== undefined ? notifyByEmail : true,
      notifyByWeb: notifyByWeb !== undefined ? notifyByWeb : true,
      notifyByPhone: notifyByPhone !== undefined ? notifyByPhone : false,
    });

    res.status(201).json({ success: true, message: 'Course added to watchlist', data: watchlist });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWatchlistSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      // Deprecated per-watchlist settings (kept for backwards compatibility)
      notifyOnOpen, notifyOnClose, notifyOnSimilarCourse, notifyByEmail, notifyByWeb, notifyByPhone,
      // New similar course filter settings
      similarFilters, similarFilterNewlyOpened 
    } = req.body;

    const watchlist = await Watchlist.findOne({
      where: { id, userId: req.user!.id },
    });

    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist item not found' });
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    // Deprecated fields (kept for backwards compatibility)
    if (notifyOnOpen !== undefined) updateData.notifyOnOpen = notifyOnOpen;
    if (notifyOnClose !== undefined) updateData.notifyOnClose = notifyOnClose;
    if (notifyOnSimilarCourse !== undefined) updateData.notifyOnSimilarCourse = notifyOnSimilarCourse;
    if (notifyByEmail !== undefined) updateData.notifyByEmail = notifyByEmail;
    if (notifyByWeb !== undefined) updateData.notifyByWeb = notifyByWeb;
    if (notifyByPhone !== undefined) updateData.notifyByPhone = notifyByPhone;
    
    // New filter fields
    if (similarFilters !== undefined) updateData.similarFilters = similarFilters;
    if (similarFilterNewlyOpened !== undefined) updateData.similarFilterNewlyOpened = similarFilterNewlyOpened;

    await watchlist.update(updateData);

    res.json({ success: true, message: 'Watchlist settings updated', data: watchlist });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWatchlist = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const watchlist = await Watchlist.findOne({
      where: { id, userId: req.user!.id },
    });

    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist item not found' });
    }

    // Delete dependent notifications first to avoid FK constraint violation
    await Notification.destroy({
      where: { watchlistId: watchlist.id },
    });

    // Now delete the watchlist item
    await watchlist.destroy();

    res.json({ success: true, message: 'Course removed from watchlist' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkWatching = async (req: AuthRequest, res: Response) => {
  try {
    const courseCode = req.query.courseCode as string;
    const section = req.query.section as string;

    if (!courseCode || !section) {
      return res.status(400).json({ success: false, message: 'Course code and section required' });
    }

    const watchlist = await Watchlist.findOne({
      where: { userId: req.user!.id, courseCode, section },
    });

    res.json({ success: true, data: { isWatching: !!watchlist } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get available days/times patterns for similar courses filtering
// Patterns are based on ALL courses in the same FACULTY (for dynamic options)
// Similar courses count is based on same courseName (for accuracy)
export const getSimilarCoursePatterns = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const Op = require('sequelize').Op;

    const watchlist = await Watchlist.findOne({
      where: { id, userId: req.user!.id },
    });

    if (!watchlist) {
      return res.status(404).json({ success: false, message: 'Watchlist item not found' });
    }

    // 1. Find similar courses (same courseName, different section) for counting
    const similarCourses = await Course.findAll({
      where: { 
        courseName: watchlist.courseName,
        section: { [Op.ne]: watchlist.section }
      },
      attributes: ['days', 'time', 'section', 'instructor', 'isOpen'],
    });

    // 2. Find ALL courses in the same FACULTY to get dynamic patterns
    // Exclude the currently watched course section
    const facultyCourses = await Course.findAll({
      where: { 
        faculty: watchlist.faculty || '',
        [Op.or]: [
          { courseCode: { [Op.ne]: watchlist.courseCode } },
          { section: { [Op.ne]: watchlist.section } }
        ]
      },
      attributes: ['days', 'time', 'creditHours'],
      order: [['days', 'ASC'], ['time', 'ASC']],
    });

    // 3. Group by days pattern, collect unique times and count for each pattern
    const patternMap = new Map<string, { times: Set<string>; count: number }>();
    
    facultyCourses.forEach(course => {
      const days = (course.days || '').trim();
      const time = (course.time || '').trim();
      
      if (!days) return; // Skip courses with no days
      
      if (!patternMap.has(days)) {
        patternMap.set(days, { times: new Set(), count: 0 });
      }
      
      const pattern = patternMap.get(days)!;
      pattern.count++;
      
      if (time) {
        pattern.times.add(time);
      }
    });

    // 4. Convert to array format, sorted by count (most common first)
    const patterns = Array.from(patternMap.entries())
      .map(([days, data]) => ({
        days,
        times: Array.from(data.times).sort(),
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count);

    // 5. Get patterns from similar courses specifically (for highlighting)
    const similarPatternSet = new Set<string>();
    similarCourses.forEach(course => {
      const days = (course.days || '').trim();
      if (days) similarPatternSet.add(days);
    });

    res.json({ 
      success: true, 
      data: {
        patterns,
        similarCoursesCount: similarCourses.length,
        openCount: similarCourses.filter(c => c.isOpen).length,
        facultyPatternsCount: patterns.length,
        similarPatterns: Array.from(similarPatternSet), // Patterns that have similar courses
        faculty: watchlist.faculty,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
