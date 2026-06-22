const path = require('path');
const fs = require('fs');
const PdfPrinter = require('pdfmake');
const ExcelJS = require('exceljs');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Department = require('../models/Department');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// PDF fonts configuration
const fonts = {
  Roboto: {
    normal: path.join(__dirname, '..', 'node_modules', 'pdfmake', 'build', 'vfs_fonts.js'),
  },
};

/**
 * Helper: Build attendance query from filters
 */
async function buildAttendanceQuery(filters) {
  const query = {};

  if (filters.subject) query.subject = filters.subject;

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) query.date.$gte = new Date(filters.startDate);
    if (filters.endDate) query.date.$lte = new Date(filters.endDate);
  }

  if (filters.department) {
    const students = await Student.find({ department: filters.department }).select('_id');
    query.student = { $in: students.map((s) => s._id) };
  }

  return query;
}

/**
 * Helper: Fetch attendance data with populated fields
 */
async function fetchAttendanceData(query) {
  return Attendance.find(query)
    .populate({
      path: 'student',
      populate: [
        { path: 'user', select: 'name email' },
        { path: 'department', select: 'name code' },
      ],
    })
    .populate('subject', 'name code')
    .populate({
      path: 'session',
      populate: {
        path: 'faculty',
        populate: { path: 'user', select: 'name' },
      },
    })
    .sort({ date: -1, 'student.rollNumber': 1 });
}

/**
 * @desc    Generate PDF report
 * @route   POST /api/reports/pdf
 * @access  Private (admin, faculty)
 */
const generatePDFReport = async (req, res, next) => {
  try {
    const filters = req.query && Object.keys(req.query).length > 0 ? req.query : req.body;
    let { type, department, subject, startDate, endDate, title } = filters;

    if (req.user.role === 'faculty' && req.user.isHOD) {
      department = req.user.hodDepartment.toString();
    }

    const query = await buildAttendanceQuery({ department, subject, startDate, endDate });
    const records = await fetchAttendanceData(query);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for the given filters',
      });
    }

    // Calculate summary stats
    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const percentage = ((presentCount / totalRecords) * 100).toFixed(2);

    // Build table body
    const tableBody = [
      [
        { text: '#', style: 'tableHeader' },
        { text: 'Student Name', style: 'tableHeader' },
        { text: 'Roll No.', style: 'tableHeader' },
        { text: 'Subject', style: 'tableHeader' },
        { text: 'Date', style: 'tableHeader' },
        { text: 'Status', style: 'tableHeader' },
        { text: 'Method', style: 'tableHeader' },
      ],
    ];

    records.forEach((record, index) => {
      tableBody.push([
        index + 1,
        record.student && record.student.user ? record.student.user.name : 'N/A',
        record.student ? record.student.rollNumber : 'N/A',
        record.subject ? `${record.subject.name} (${record.subject.code})` : 'N/A',
        new Date(record.date).toLocaleDateString('en-IN'),
        {
          text: record.status.toUpperCase(),
          color: record.status === 'present' ? '#16a34a' : record.status === 'late' ? '#ca8a04' : '#dc2626',
        },
        record.verificationMethod || 'N/A',
      ]);
    });

    // PDF document definition
    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'landscape',
      pageMargins: [40, 60, 40, 60],
      content: [
        {
          text: title || 'Attendance Report',
          style: 'header',
          alignment: 'center',
        },
        {
          text: `Generated on: ${new Date().toLocaleString('en-IN')}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        {
          text: `Report Type: ${type || 'Custom'} | Period: ${startDate || 'N/A'} to ${endDate || 'N/A'}`,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        // Summary box
        {
          columns: [
            {
              text: `Total Records: ${totalRecords}`,
              style: 'summaryItem',
              width: '*',
            },
            {
              text: `Present: ${presentCount}`,
              style: 'summaryItem',
              width: '*',
            },
            {
              text: `Absent: ${absentCount}`,
              style: 'summaryItem',
              width: '*',
            },
            {
              text: `Attendance: ${percentage}%`,
              style: 'summaryItem',
              width: '*',
            },
          ],
          margin: [0, 0, 0, 20],
        },
        // Attendance table
        {
          table: {
            headerRows: 1,
            widths: [30, '*', 70, '*', 70, 60, 60],
            body: tableBody,
          },
          layout: {
            fillColor: function (rowIndex) {
              return rowIndex === 0 ? '#1e40af' : rowIndex % 2 === 0 ? '#f0f4ff' : null;
            },
            hLineWidth: function () {
              return 0.5;
            },
            vLineWidth: function () {
              return 0.5;
            },
            hLineColor: function () {
              return '#d1d5db';
            },
            vLineColor: function () {
              return '#d1d5db';
            },
          },
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true, color: '#1e40af' },
        subheader: { fontSize: 10, color: '#6b7280' },
        summaryItem: { fontSize: 11, bold: true, alignment: 'center' },
        tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: '#1e40af' },
      },
      defaultStyle: { fontSize: 8 },
    };

    // Generate PDF using pdfmake's createPdf (for vfs-based approach)
    const PdfMake = require('pdfmake/build/pdfmake');
    const pdfFonts = require('pdfmake/build/vfs_fonts');
    PdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

    const pdfDoc = PdfMake.createPdf(docDefinition);

    pdfDoc.getBuffer((buffer) => {
      const filename = `attendance_report_${Date.now()}.pdf`;
      const filepath = path.join(reportsDir, filename);
      const nodeBuffer = Buffer.from(buffer);

      fs.writeFileSync(filepath, nodeBuffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(nodeBuffer);
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate Excel report
 * @route   POST /api/reports/excel
 * @access  Private (admin, faculty)
 */
const generateExcelReport = async (req, res, next) => {
  try {
    const filters = req.query && Object.keys(req.query).length > 0 ? req.query : req.body;
    let { type, department, subject, startDate, endDate, title } = filters;

    if (req.user.role === 'faculty' && req.user.isHOD) {
      department = req.user.hodDepartment.toString();
    }

    const query = await buildAttendanceQuery({ department, subject, startDate, endDate });
    const records = await fetchAttendanceData(query);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for the given filters',
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance System';
    workbook.created = new Date();

    // === Sheet 1: Attendance Records ===
    const sheet = workbook.addWorksheet('Attendance Records', {
      properties: { tabColor: { argb: '1E40AF' } },
    });

    // Title row
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title || 'Attendance Report';
    titleCell.font = { size: 16, bold: true, color: { argb: '1E40AF' } };
    titleCell.alignment = { horizontal: 'center' };

    // Subtitle
    sheet.mergeCells('A2:H2');
    const subtitleCell = sheet.getCell('A2');
    subtitleCell.value = `Generated: ${new Date().toLocaleString('en-IN')} | Type: ${type || 'Custom'}`;
    subtitleCell.font = { size: 10, italic: true, color: { argb: '6B7280' } };
    subtitleCell.alignment = { horizontal: 'center' };

    // Headers (row 4)
    const headers = ['#', 'Student Name', 'Roll No.', 'Department', 'Subject', 'Date', 'Status', 'Method'];
    const headerRow = sheet.getRow(4);
    headers.forEach((header, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1E40AF' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data rows
    records.forEach((record, index) => {
      const row = sheet.getRow(index + 5);
      row.getCell(1).value = index + 1;
      row.getCell(2).value = record.student && record.student.user ? record.student.user.name : 'N/A';
      row.getCell(3).value = record.student ? record.student.rollNumber : 'N/A';
      row.getCell(4).value =
        record.student && record.student.department ? record.student.department.name : 'N/A';
      row.getCell(5).value = record.subject ? `${record.subject.name} (${record.subject.code})` : 'N/A';
      row.getCell(6).value = new Date(record.date).toLocaleDateString('en-IN');
      row.getCell(7).value = record.status.toUpperCase();
      row.getCell(8).value = record.verificationMethod || 'N/A';

      // Color-code status
      const statusCell = row.getCell(7);
      if (record.status === 'present') {
        statusCell.font = { color: { argb: '16A34A' }, bold: true };
      } else if (record.status === 'absent') {
        statusCell.font = { color: { argb: 'DC2626' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'CA8A04' }, bold: true };
      }

      // Alternate row coloring
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F0F4FF' },
          };
        });
      }

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'D1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
          left: { style: 'thin', color: { argb: 'D1D5DB' } },
          right: { style: 'thin', color: { argb: 'D1D5DB' } },
        };
      });
    });

    // Column widths
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 20;
    sheet.getColumn(5).width = 30;
    sheet.getColumn(6).width = 15;
    sheet.getColumn(7).width = 12;
    sheet.getColumn(8).width = 12;

    // === Sheet 2: Summary ===
    const summarySheet = workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: '16A34A' } },
    });

    const totalRecords = records.length;
    const presentCount = records.filter((r) => r.status === 'present' || r.status === 'late').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.status === 'late').length;

    summarySheet.mergeCells('A1:B1');
    summarySheet.getCell('A1').value = 'Attendance Summary';
    summarySheet.getCell('A1').font = { size: 14, bold: true, color: { argb: '1E40AF' } };

    const summaryData = [
      ['Total Records', totalRecords],
      ['Present', presentCount],
      ['Absent', absentCount],
      ['Late', lateCount],
      ['Attendance %', `${((presentCount / totalRecords) * 100).toFixed(2)}%`],
      ['Report Period', `${startDate || 'N/A'} to ${endDate || 'N/A'}`],
      ['Report Type', type || 'Custom'],
    ];

    summaryData.forEach((item, index) => {
      const row = summarySheet.getRow(index + 3);
      row.getCell(1).value = item[0];
      row.getCell(1).font = { bold: true };
      row.getCell(2).value = item[1];
    });

    summarySheet.getColumn(1).width = 20;
    summarySheet.getColumn(2).width = 25;

    // Generate and send file
    const filename = `attendance_report_${Date.now()}.xlsx`;
    const filepath = path.join(reportsDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate CSV report
 * @route   POST /api/reports/csv
 * @access  Private (admin, faculty)
 */
const generateCSVReport = async (req, res, next) => {
  try {
    const filters = req.query && Object.keys(req.query).length > 0 ? req.query : req.body;
    let { type, department, subject, startDate, endDate } = filters;

    if (req.user.role === 'faculty' && req.user.isHOD) {
      department = req.user.hodDepartment.toString();
    }

    const query = await buildAttendanceQuery({ department, subject, startDate, endDate });
    const records = await fetchAttendanceData(query);

    if (records.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for the given filters',
      });
    }

    // Build CSV content
    const csvHeaders = [
      'S.No.',
      'Student Name',
      'Roll Number',
      'Email',
      'Department',
      'Subject',
      'Subject Code',
      'Date',
      'Status',
      'Verification Method',
      'Face Confidence',
      'Marked At',
    ];

    let csvContent = csvHeaders.join(',') + '\n';

    records.forEach((record, index) => {
      const row = [
        index + 1,
        `"${record.student && record.student.user ? record.student.user.name : 'N/A'}"`,
        record.student ? record.student.rollNumber : 'N/A',
        `"${record.student && record.student.user ? record.student.user.email : 'N/A'}"`,
        `"${record.student && record.student.department ? record.student.department.name : 'N/A'}"`,
        `"${record.subject ? record.subject.name : 'N/A'}"`,
        record.subject ? record.subject.code : 'N/A',
        new Date(record.date).toLocaleDateString('en-IN'),
        record.status.toUpperCase(),
        record.verificationMethod || 'N/A',
        record.faceConfidence != null ? record.faceConfidence.toFixed(4) : 'N/A',
        record.markedAt ? new Date(record.markedAt).toLocaleString('en-IN') : 'N/A',
      ];
      csvContent += row.join(',') + '\n';
    });

    const filename = `attendance_report_${Date.now()}.csv`;
    const filepath = path.join(reportsDir, filename);
    fs.writeFileSync(filepath, csvContent);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generatePDFReport,
  generateExcelReport,
  generateCSVReport,
};
