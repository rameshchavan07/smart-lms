class Course {
  final String id;
  final String title;
  final String? description;
  final String? thumbnailUrl;
  final String teacherName;
  final int lecturesCount;

  Course({
    required this.id,
    required this.title,
    this.description,
    this.thumbnailUrl,
    required this.teacherName,
    required this.lecturesCount,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    // If it's an enrollment object
    final courseData = json['course'] ?? json;
    
    String teacherName = 'Instructor';
    if (courseData['teacher'] != null && courseData['teacher']['user'] != null) {
      final user = courseData['teacher']['user'];
      teacherName = '${user['firstName']} ${user['lastName']}';
    }

    return Course(
      id: courseData['id'] ?? '',
      title: courseData['title'] ?? '',
      description: courseData['description'],
      thumbnailUrl: courseData['thumbnailUrl'],
      teacherName: teacherName,
      lecturesCount: courseData['_count']?['lectures'] ?? 0,
    );
  }
}

class Lecture {
  final String id;
  final String title;
  final String? description;
  final DateTime? startTime;
  final DateTime? endTime;
  final String? meetingUrl;
  final String? status;

  Lecture({
    required this.id,
    required this.title,
    this.description,
    this.startTime,
    this.endTime,
    this.meetingUrl,
    this.status,
  });

  factory Lecture.fromJson(Map<String, dynamic> json) {
    return Lecture(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      startTime: json['startTime'] != null ? DateTime.tryParse(json['startTime']) : null,
      endTime: json['endTime'] != null ? DateTime.tryParse(json['endTime']) : null,
      meetingUrl: json['meetingUrl'],
      status: json['status'],
    );
  }
}

class StudyMaterial {
  final String id;
  final String title;
  final String? description;
  final String? fileUrl;

  StudyMaterial({
    required this.id,
    required this.title,
    this.description,
    this.fileUrl,
  });

  factory StudyMaterial.fromJson(Map<String, dynamic> json) {
    return StudyMaterial(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      fileUrl: json['fileUrl'] ?? json['url'], // fallback for URL key
    );
  }
}
