import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:jitsi_meet_wrapper/jitsi_meet_wrapper.dart';
import '../providers/course_provider.dart';
import '../providers/auth_provider.dart';
import '../models/course.dart';

class CourseDetailsScreen extends StatefulWidget {
  final Course course;
  
  const CourseDetailsScreen({super.key, required this.course});

  @override
  State<CourseDetailsScreen> createState() => _CourseDetailsScreenState();
}

class _CourseDetailsScreenState extends State<CourseDetailsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CourseProvider>().fetchCourseDetails(widget.course.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.course.title),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Lectures'),
            Tab(text: 'Materials'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(),
          _buildLecturesTab(),
          _buildMaterialsTab(),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (widget.course.thumbnailUrl != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                widget.course.thumbnailUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  height: 200,
                  color: Colors.grey[300],
                  child: const Icon(Icons.broken_image, size: 50, color: Colors.grey),
                ),
              ),
            ),
          const SizedBox(height: 24),
          const Text(
            'About this course',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Text(
            widget.course.description ?? 'No description available.',
            style: const TextStyle(fontSize: 16, height: 1.5),
          ),
          const SizedBox(height: 24),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: const Text('Instructor'),
            subtitle: Text(widget.course.teacherName),
          ),
        ],
      ),
    );
  }

  Widget _buildLecturesTab() {
    return Consumer<CourseProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (provider.error != null) {
          return Center(child: Text(provider.error!));
        }
        if (provider.lectures.isEmpty) {
          return const Center(child: Text('No lectures available.'));
        }
        
        return ListView.separated(
          padding: const EdgeInsets.all(16.0),
          itemCount: provider.lectures.length,
          separatorBuilder: (context, index) => const Divider(),
          itemBuilder: (context, index) {
            final lecture = provider.lectures[index];
            final bool isLive = lecture.status == 'LIVE' || lecture.status == 'ONGOING';
            
            return ListTile(
              leading: Icon(
                isLive ? Icons.videocam : Icons.play_circle_outline,
                color: isLive ? Colors.red : Colors.blue,
                size: 32,
              ),
              title: Text(lecture.title, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(lecture.description ?? 'Lecture'),
              trailing: isLive
                  ? ElevatedButton(
                      onPressed: () async {
                        final authProvider = context.read<AuthProvider>();
                        final user = authProvider.user;
                        String userName = 'Student';
                        String userEmail = '';
                        if (user != null) {
                          userName = '${user['firstName']} ${user['lastName']}';
                          userEmail = user['email'] ?? '';
                        }
                        
                        final String meetingUrl = lecture.meetingUrl ?? 'open-learn-x-${lecture.id}';
                        String roomName = meetingUrl;
                        String serverUrl = '';
                        if (meetingUrl.startsWith('http')) {
                          final uri = Uri.parse(meetingUrl);
                          serverUrl = '${uri.scheme}://${uri.host}';
                          roomName = uri.pathSegments.last;
                        }

                        var options = JitsiMeetingOptions(
                          roomNameOrUrl: roomName,
                          serverUrl: serverUrl.isNotEmpty ? serverUrl : null,
                          userDisplayName: userName,
                          userEmail: userEmail,
                          isAudioMuted: true,
                          isVideoMuted: true,
                        );

                        await JitsiMeetWrapper.joinMeeting(options: options);
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                      child: const Text('Join Live'),
                    )
                  : null,
            );
          },
        );
      },
    );
  }

  Widget _buildMaterialsTab() {
    return Consumer<CourseProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (provider.error != null) {
          return Center(child: Text(provider.error!));
        }
        if (provider.materials.isEmpty) {
          return const Center(child: Text('No materials available.'));
        }
        
        return ListView.separated(
          padding: const EdgeInsets.all(16.0),
          itemCount: provider.materials.length,
          separatorBuilder: (context, index) => const Divider(),
          itemBuilder: (context, index) {
            final material = provider.materials[index];
            return ListTile(
              leading: const Icon(Icons.picture_as_pdf, color: Colors.red, size: 32),
              title: Text(material.title, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(material.description ?? 'Document'),
              trailing: IconButton(
                icon: const Icon(Icons.download),
                onPressed: () async {
                  if (material.fileUrl != null) {
                    final uri = Uri.parse(material.fileUrl!);
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  }
                },
              ),
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
