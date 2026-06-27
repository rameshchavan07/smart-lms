const fs = require('fs');
const file = 'd:/New folder/smart-lms/frontend/src/pages/shared/CourseDetails.tsx';
let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const mangled = `                    </a>
                    {user?.role === 'TEACHER' && (
                      <button 
            </div>
          ) : enrolledStudents.length === 0 ? (`.replace(/\r\n/g, '\n');

const correct = `                    </a>
                    {user?.role === 'TEACHER' && (
                      <button 
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'students' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Enrolled Students</h3>
            <button 
              onClick={() => setShowEnrollModal(true)}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Enroll Student
            </button>
          </div>

          {studentsLoading ? (
            <div className="text-center py-8 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
              <span className="text-xs mt-2 block">Loading enrolled students...</span>
            </div>
          ) : enrolledStudents.length === 0 ? (`.replace(/\r\n/g, '\n');

if (content.includes(mangled)) {
  fs.writeFileSync(file, content.replace(mangled, correct));
  console.log('Fixed!');
} else {
  console.log('Not found');
  console.log(content.substring(content.indexOf('Download/View') - 100, content.indexOf('Download/View') + 200));
}
