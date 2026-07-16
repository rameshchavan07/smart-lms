import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:mobile/features/auth/presentation/auth_provider.dart';
import '../data/dashboard_repository.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final dashboardDataAsync = ref.watch(dashboardDataProvider);
    final userName = authState.user?['firstName'] ?? 'Student';

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(dashboardDataProvider.future),
        child: CustomScrollView(
          slivers: [
            SliverAppBar.large(
              title: Text('Welcome back, $userName!'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.logout),
                  onPressed: () {
                    ref.read(authProvider.notifier).logout();
                  },
                )
              ],
            ),
            SliverToBoxAdapter(
              child: dashboardDataAsync.when(
                loading: () => const Padding(
                  padding: EdgeInsets.all(40.0),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (err, stack) => Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Error loading dashboard:\n$err', textAlign: TextAlign.center),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => ref.refresh(dashboardDataProvider),
                        child: const Text('Retry'),
                      )
                    ],
                  ),
                ),
                data: (data) => _buildDashboardContent(context, data),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardContent(BuildContext context, DashboardData data) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Progress',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),
          const SizedBox(height: 16),
          
          // Modern Stats Grid
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Enrolled', 
                  '${data.metrics['totalEnrollments'] ?? 0}', 
                  Icons.book_outlined, 
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard(
                  'Completed', 
                  '${data.metrics['totalCompleted'] ?? 0}', 
                  Icons.check_circle_outline, 
                  Colors.green,
                ),
              ),
            ],
          ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.2),
          
          const SizedBox(height: 32),
          const Text(
            'Recent Courses',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
          const SizedBox(height: 16),
          
          if (data.recentCourses.isEmpty)
            const Padding(
              padding: EdgeInsets.all(20.0),
              child: Text("You haven't enrolled in any courses yet."),
            )
          else
            ...data.recentCourses.asMap().entries.map((entry) {
              final idx = entry.key;
              final courseData = entry.value;
              final course = courseData['course'] ?? {};
              final progress = courseData['progress'] ?? 0;
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 12.0),
                child: _buildCourseCard(
                  course['title'] ?? 'Unknown Course',
                  'Progress: $progress%',
                  (progress as num).toDouble() / 100.0,
                ).animate().fadeIn(delay: Duration(milliseconds: 600 + (idx * 100))).slideX(begin: 0.1),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildCourseCard(String title, String subtitle, double progress) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () {
          // Navigate to course details
        },
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.computer, color: Colors.blue, size: 30),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.grey.shade200,
                      color: Colors.blue,
                      borderRadius: BorderRadius.circular(10),
                    )
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
