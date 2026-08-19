let selectedCourses = [];
let courseId = 0;
let editingCourseId = null;

const workingHours = [];
for (let hour = 7; hour <= 18; hour++) {
    const hourStr = String(hour).padStart(2, '0');
    workingHours.push(`${hourStr}:00`);
    workingHours.push(`${hourStr}:15`);
    workingHours.push(`${hourStr}:30`);
    workingHours.push(`${hourStr}:45`);
}

const coursePalette = [
    '#E91E63',
    '#e418c9',
    '#9C27B0',
    '#673AB7',
    '#3c4eb3',
    '#0e7ad1',
    '#29afec',
    '#00BCD4',
    '#009688',
    '#4CAF50',
    '#8BC34A',
    '#EFFD5F',
    '#FED049',
    '#FF9800',
    '#FF0000',
    '#4B371C'
];

function getCourseColor(courseOrId) {
    const id = typeof courseOrId === 'object' ? courseOrId.id : courseOrId;
    if (typeof courseOrId === 'object' && courseOrId.color) {
        return courseOrId.color;
    }
    return coursePalette[id % coursePalette.length];
}

function saveCourses() {
    localStorage.setItem('selectedCourses', JSON.stringify(selectedCourses));
    localStorage.setItem('courseId', courseId);
}

function loadCourses() {
    const savedCourses = localStorage.getItem('selectedCourses');
    if (savedCourses) {
        selectedCourses = JSON.parse(savedCourses);
        selectedCourses = selectedCourses.map(course => ({
            ...course,
            color: course.color || getCourseColor(course.id)
        }));
    }
    const savedCourseId = localStorage.getItem('courseId');
    if (savedCourseId) {
        courseId = parseInt(savedCourseId);
    }
}

function populateTimeSelects() {
    const selectIds = ['startTime', 'endTime', 'examStartTime', 'examEndTime'];
    selectIds.forEach(id => {
        const select = document.getElementById(id);
        select.innerHTML = '<option value="">انتخاب ساعت...</option>';
        workingHours.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            select.appendChild(option);
        });
    });
}

function populateColorPalette() {
    const paletteContainer = document.getElementById('colorPalette');
    paletteContainer.innerHTML = '';
    coursePalette.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        swatch.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            swatch.classList.add('selected');
            document.getElementById('selectedColor').value = color;
        });
        paletteContainer.appendChild(swatch);
    });
}

function isValidJalaliDate(year, month, day) {
    if (!year || !month || !day) return false;
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    if (y < 1300 || y > 1500) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    return true;
}

function getJalaliDate() {
    const year = document.getElementById('examYear').value.trim();
    const month = document.getElementById('examMonth').value.trim();
    const day = document.getElementById('examDay').value.trim();
    if (year && month && day) {
        return `${year}/${month}/${day}`;
    }
    return '';
}

function setJalaliDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        document.getElementById('examYear').value = parts[0];
        document.getElementById('examMonth').value = parts[1];
        document.getElementById('examDay').value = parts[2];
    } else {
        document.getElementById('examYear').value = '';
        document.getElementById('examMonth').value = '';
        document.getElementById('examDay').value = '';
    }
}

function calculateDuration(start, end) {
    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);
    const diff = endMin - startMin;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours === 0) return `${minutes} دقیقه`;
    if (minutes === 0) return `${hours} ساعت`;
    return `${hours}.${Math.round(minutes/60*10)} ساعت`;
}

function buildScheduleTable() {
    const thead = document.querySelector('#scheduleTable thead');
    const tbody = document.querySelector('#scheduleTable tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    const headerRow1 = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.rowSpan = 2;
    cornerTh.textContent = 'روز / ساعت';
    headerRow1.appendChild(cornerTh);
    
    for (let hour = 7; hour <= 18; hour++) {
        const hourLabel = document.createElement('th');
        hourLabel.colSpan = 4;
        hourLabel.className = 'hour-label';
        hourLabel.textContent = `${String(hour).padStart(2, '0')}:00`;
        headerRow1.appendChild(hourLabel);
    }
    thead.appendChild(headerRow1);
    
    const headerRow2 = document.createElement('tr');
    for (let hour = 7; hour <= 18; hour++) {
        const quarters = ['00', '15', '30', '45'];
        quarters.forEach(q => {
            const quarterTh = document.createElement('th');
            quarterTh.className = 'quarter-label';
            quarterTh.textContent = q;
            headerRow2.appendChild(quarterTh);
        });
    }
    thead.appendChild(headerRow2);
    
    const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];
    for (let day = 0; day < 6; day++) {
        const row = document.createElement('tr');
        
        const dayLabel = document.createElement('td');
        dayLabel.className = 'day-label';
        dayLabel.textContent = dayNames[day];
        row.appendChild(dayLabel);
        
        let timeIndex = 0;
        while (timeIndex < workingHours.length) {
            const time = workingHours[timeIndex];
            
            const course = selectedCourses.find(c => 
                c.days.includes(day) && c.startTime === time
            );
            
            if (course) {
                const startMin = timeToMinutes(course.startTime);
                const endMin = timeToMinutes(course.endTime);
                const duration = endMin - startMin;
                const slots = Math.ceil(duration / 15);
                
                const cell = document.createElement('td');
                cell.colSpan = slots;
                cell.className = 'course-cell';
                cell.style.backgroundColor = course.color || getCourseColor(course);
                cell.dataset.courseId = course.id;
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'course-name';
                nameSpan.textContent = course.name;
                cell.appendChild(nameSpan);
                
                const durationSpan = document.createElement('span');
                durationSpan.className = 'course-duration';
                durationSpan.textContent = calculateDuration(course.startTime, course.endTime);
                cell.appendChild(durationSpan);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '✕';
                deleteBtn.title = 'حذف';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    removeCourse(course.id);
                };
                cell.appendChild(deleteBtn);
                
                row.appendChild(cell);
                timeIndex += slots;
            } else {
                const cell = document.createElement('td');
                cell.id = `cell-${day}-${time}`;
                cell.dataset.day = day;
                cell.dataset.time = time;
                row.appendChild(cell);
                timeIndex++;
            }
        }
        
        tbody.appendChild(row);
    }
    
    document.querySelector('#scheduleTable').classList.add('print-friendly');
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

function getSelectedDays() {
    const checkboxes = document.querySelectorAll('input[name="courseDays"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

function checkTimeConflict(newCourse, existingCourses) {
    const conflicts = [];
    const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];
    
    existingCourses.forEach(existingCourse => {
        if (existingCourse.id === newCourse.id) return;
        newCourse.days.forEach(day => {
            if (existingCourse.days.includes(day)) {
                const newStart = timeToMinutes(newCourse.startTime);
                const newEnd = timeToMinutes(newCourse.endTime);
                const existingStart = timeToMinutes(existingCourse.startTime);
                const existingEnd = timeToMinutes(existingCourse.endTime);
                
                if (newStart < existingEnd && newEnd > existingStart) {
                    conflicts.push({
                        type: 'class',
                        course: existingCourse,
                        message: `تداخل کلاس با درس "${existingCourse.name}" در روز ${dayNames[day]}`
                    });
                }
            }
        });
    });
    
    existingCourses.forEach(existingCourse => {
        if (existingCourse.id === newCourse.id) return;
        if (newCourse.examDate && existingCourse.examDate && newCourse.examDate === existingCourse.examDate) {
            if (newCourse.examStartTime && existingCourse.examStartTime && newCourse.examEndTime && existingCourse.examEndTime) {
                const newExamStart = timeToMinutes(newCourse.examStartTime);
                const newExamEnd = timeToMinutes(newCourse.examEndTime);
                const existingExamStart = timeToMinutes(existingCourse.examStartTime);
                const existingExamEnd = timeToMinutes(existingCourse.examEndTime);
                
                if (newExamStart < existingExamEnd && newExamEnd > existingExamStart) {
                    conflicts.push({
                        type: 'exam',
                        course: existingCourse,
                        message: `تداخل امتحان با درس "${existingCourse.name}"`
                    });
                }
            }
        }
    });
    
    return conflicts;
}

function showErrors(errors) {
    const errorContainer = document.getElementById('errorMessages');
    errorContainer.innerHTML = '';
    
    if (errors.length > 0) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        
        const errorTitle = document.createElement('strong');
        errorTitle.textContent = '⚠️ تداخل پیدا شد:';
        errorDiv.appendChild(errorTitle);
        
        errors.forEach(error => {
            const errorText = document.createElement('p');
            errorText.textContent = error.message;
            errorDiv.appendChild(errorText);
        });
        
        errorContainer.appendChild(errorDiv);
    }
}

function removeCourse(courseId) {
    selectedCourses = selectedCourses.filter(course => course.id !== courseId);
    if (editingCourseId === courseId) {
        resetForm();
    }
    saveCourses();
    buildScheduleTable();
    updateCourseList();
    updateTotalUnits();
    updateTotalDays();
}

function editCourse(courseId) {
    const course = selectedCourses.find(c => c.id === courseId);
    if (!course) return;
    
    editingCourseId = courseId;
    document.getElementById('editingCourseId').value = courseId;
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseUnits').value = (course.units !== undefined && course.units !== null) ? course.units : 3;
    
    document.querySelectorAll('input[name="courseDays"]').forEach(cb => {
        cb.checked = course.days.includes(parseInt(cb.value));
    });
    
    document.getElementById('startTime').value = course.startTime;
    document.getElementById('endTime').value = course.endTime;
    setJalaliDate(course.examDate || '');
    document.getElementById('examStartTime').value = course.examStartTime || '';
    document.getElementById('examEndTime').value = course.examEndTime || '';
    
    const selectedColor = course.color || getCourseColor(course);
    document.getElementById('selectedColor').value = selectedColor;
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        if (swatch.dataset.color === selectedColor) {
            swatch.classList.add('selected');
        } else {
            swatch.classList.remove('selected');
        }
    });
    
    document.getElementById('formTitle').textContent = 'ویرایش درس';
    document.getElementById('submitBtn').textContent = '💾 ذخیره تغییرات';
    
    showErrors([]);

    document.getElementById('formSection').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('courseName').focus({ preventScroll: true });
}

function resetForm() {
    editingCourseId = null;
    document.getElementById('editingCourseId').value = '';
    document.getElementById('courseForm').reset();
    document.querySelectorAll('input[name="courseDays"]').forEach(cb => cb.checked = false);
    document.getElementById('startTime').value = '';
    document.getElementById('endTime').value = '';
    document.getElementById('examYear').value = '';
    document.getElementById('examMonth').value = '';
    document.getElementById('examDay').value = '';
    document.getElementById('examStartTime').value = '';
    document.getElementById('examEndTime').value = '';
    document.getElementById('courseUnits').value = 3;
    document.getElementById('selectedColor').value = '';
    document.querySelectorAll('.color-swatch').forEach(swatch => swatch.classList.remove('selected'));
    document.getElementById('formTitle').textContent = 'افزودن درس جدید';
    document.getElementById('submitBtn').textContent = '💾 افزودن به برنامه';
    showErrors([]);
}

function updateCourseList() {
    const courseList = document.getElementById('courseList');
    courseList.innerHTML = '';
    
    const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];
    
    selectedCourses.forEach(course => {
        const li = document.createElement('li');
        li.dataset.courseId = course.id;
        
        const courseInfo = document.createElement('div');
        courseInfo.className = 'course-info';
        
        const daysText = course.days.map(day => dayNames[day]).join('، ');
        const examInfo = course.examDate ? `امتحان: ${course.examDate} - ${course.examStartTime || '?'} تا ${course.examEndTime || '?'}` : 'امتحان: ندارد';
        const unitsDisplay = (course.units !== undefined && course.units !== null) ? course.units : 3;
        
        courseInfo.innerHTML = `
            <strong>${course.name}</strong><br>
            <small>واحد: ${unitsDisplay}</small><br>
            <small>کلاس: ${daysText} - ${course.startTime} تا ${course.endTime}</small><br>
            <small>${examInfo}</small>
        `;
        
        const courseActions = document.createElement('div');
        courseActions.className = 'course-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = '✏️ ویرایش';
        editBtn.onclick = () => editCourse(course.id);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '🗑️ حذف';
        deleteBtn.onclick = () => removeCourse(course.id);
        
        courseActions.appendChild(editBtn);
        courseActions.appendChild(deleteBtn);
        
        li.appendChild(courseInfo);
        li.appendChild(courseActions);
        courseList.appendChild(li);
    });
}

function updateTotalUnits() {
    const total = selectedCourses.reduce((sum, course) => sum + ((course.units !== undefined && course.units !== null) ? course.units : 0), 0);
    document.getElementById('totalUnits').textContent = total;
}

function updateTotalDays() {
    const daysSet = new Set();
    selectedCourses.forEach(course => {
        course.days.forEach(day => daysSet.add(day));
    });
    document.getElementById('totalDays').textContent = daysSet.size;
}

document.getElementById('courseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const courseName = document.getElementById('courseName').value.trim();
    const courseUnitsInput = document.getElementById('courseUnits').value.trim();
    const courseUnits = parseInt(courseUnitsInput);
    
    if (!courseName) {
        alert('نام درس را وارد کنید!');
        return;
    }
    
    if (isNaN(courseUnits) || courseUnits < 0) {
        alert('تعداد واحد باید عددی نامنفی باشد!');
        return;
    }
    
    const selectedDays = getSelectedDays();
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const examYear = document.getElementById('examYear').value.trim();
    const examMonth = document.getElementById('examMonth').value.trim();
    const examDay = document.getElementById('examDay').value.trim();
    const examDate = getJalaliDate();
    const examStartTime = document.getElementById('examStartTime').value;
    const examEndTime = document.getElementById('examEndTime').value;
    const selectedColor = document.getElementById('selectedColor').value;
    
    if ((examYear || examMonth || examDay) && !isValidJalaliDate(examYear, examMonth, examDay)) {
        alert('تاریخ امتحان را به شکل صحیح وارد کنید، مثلاً: 1403/10/15');
        return;
    }
    
    if (selectedDays.length === 0) {
        alert('لطفاً حداقل یک روز را انتخاب کنید!');
        return;
    }
    
    if (!startTime || !endTime) {
        alert('ساعت شروع و پایان کلاس را انتخاب کنید!');
        return;
    }
    
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        alert('ساعت پایان کلاس باید بعد از شروع باشد!');
        return;
    }
    
    const editingId = document.getElementById('editingCourseId').value;
    
    const courseData = {
        name: courseName,
        units: courseUnits,
        days: selectedDays,
        startTime,
        endTime,
        examDate,
        examStartTime,
        examEndTime,
        color: selectedColor || undefined
    };
    
    let newCourse;
    if (editingId) {
        const existingIndex = selectedCourses.findIndex(c => c.id === parseInt(editingId));
        if (existingIndex === -1) {
            alert('درس مورد نظر یافت نشد!');
            return;
        }
        const existingCourse = selectedCourses[existingIndex];
        newCourse = {
            ...existingCourse,
            ...courseData,
            color: selectedColor || existingCourse.color || getCourseColor(existingCourse.id)
        };
    } else {
        newCourse = {
            id: ++courseId,
            ...courseData,
            color: selectedColor || getCourseColor(courseId)
        };
    }
    
    const conflicts = checkTimeConflict(newCourse, selectedCourses);
    if (conflicts.length > 0) {
        showErrors(conflicts);
        return;
    }
    
    if (editingId) {
        const index = selectedCourses.findIndex(c => c.id === parseInt(editingId));
        selectedCourses[index] = newCourse;
    } else {
        selectedCourses.push(newCourse);
    }
    
    saveCourses();
    
    showErrors([]);
    buildScheduleTable();
    updateCourseList();
    updateTotalUnits();
    updateTotalDays();
    
    if (editingId) {
        setTimeout(() => {
            const cell = document.querySelector(`.course-cell[data-course-id="${editingId}"]`);
            if (cell) {
                cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                const listItem = document.querySelector(`li[data-course-id="${editingId}"]`);
                if (listItem) {
                    listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 0);
    }
    
    resetForm();
});

document.getElementById('examDay').addEventListener('input', function() {
    if (this.value.length === 2 && /^\d{2}$/.test(this.value) && parseInt(this.value) <= 31) {
        document.getElementById('examMonth').focus();
    }
});

document.getElementById('examMonth').addEventListener('input', function() {
    if (this.value.length === 2 && /^\d{2}$/.test(this.value) && parseInt(this.value) <= 12) {
        document.getElementById('examYear').focus();
    }
});

document.getElementById('downloadImageBtn').addEventListener('click', function() {
    const scheduleSection = document.querySelector('.schedule-section');
    const table = document.querySelector('#scheduleTable');
    
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.top = '-10000px';
    tempDiv.style.left = '-10000px';
    tempDiv.style.width = (table.scrollWidth + 40) + 'px';
    tempDiv.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
    
    const clone = scheduleSection.cloneNode(true);
    
    const buttons = clone.querySelectorAll('button');
    buttons.forEach(btn => btn.style.display = 'none');
    
    const tableContainer = clone.querySelector('.table-container');
    tableContainer.style.overflow = 'visible';
    tableContainer.style.width = '100%';
    const tableClone = clone.querySelector('#scheduleTable');
    tableClone.style.minWidth = '0';
    tableClone.style.width = 'auto';
    
    tempDiv.appendChild(clone);
    document.body.appendChild(tempDiv);
    
    html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        width: table.scrollWidth + 40,
        height: clone.offsetHeight,
        scrollX: 0,
        scrollY: 0
    }).then(canvas => {
        canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'schedule.png';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png');
        document.body.removeChild(tempDiv);
    }).catch(error => {
        console.error('Error capturing image:', error);
        alert('خطا در ذخیره تصویر');
        document.body.removeChild(tempDiv);
    });
});

loadCourses();
populateTimeSelects();
populateColorPalette();
buildScheduleTable();
updateCourseList();
updateTotalUnits();
updateTotalDays();

const darkModeToggle = document.getElementById('darkModeToggle');
darkModeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
});

if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
}
