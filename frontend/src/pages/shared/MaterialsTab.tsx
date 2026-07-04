import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Plus, 
  Download, 
  Trash2, 
  FolderOpen, 
  UploadCloud, 
  Loader2 
} from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { useAuth } from '../../contexts/AuthContext';

interface MaterialData {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  uploadedAt: string;
}

interface MaterialsTabProps {
  courseId: string;
}

const formatFileSize = (bytes: number | null) => {
  if (bytes === null || bytes === undefined) return '';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase();
  if (type.includes('pdf')) {
    return <FileText className="w-6 h-6 text-rose-500 shrink-0" />;
  }
  if (type.includes('word') || type.includes('officedocument.wordprocessingml') || type.includes('docx') || type.includes('doc')) {
    return <FileText className="w-6 h-6 text-blue-500 shrink-0" />;
  }
  if (type.includes('presentation') || type.includes('powerpoint') || type.includes('pptx')) {
    return <FileText className="w-6 h-6 text-amber-500 shrink-0" />;
  }
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('compressed')) {
    return <FolderOpen className="w-6 h-6 text-yellow-600 shrink-0" />;
  }
  return <FileText className="w-6 h-6 text-slate-400 shrink-0" />;
};

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ courseId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materials', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data } = await api.get(API_ENDPOINTS.STUDY_MATERIALS.BY_COURSE(courseId));
      return data.materials as MaterialData[];
    }
  });

  const uploadMaterialMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append('title', materialTitle || selectedFile.name);
      formData.append('description', materialDescription);
      formData.append('file', selectedFile);
      
      return api.post(API_ENDPOINTS.STUDY_MATERIALS.BY_COURSE(courseId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 2 min timeout for large files
      });
    },
    onSuccess: () => {
      toast.success(`"${selectedFile?.name}" uploaded successfully!`);
      setShowUploadMaterial(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['materials', courseId] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }, message?: string };
      toast.error(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    }
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (materialId: string) => {
      return api.delete(API_ENDPOINTS.STUDY_MATERIALS.BY_ID(materialId));
    },
    onSuccess: () => {
      toast.success('Material deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['materials', courseId] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete material.');
    }
  });

  const handleUploadMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file.");
      return;
    }
    uploadMaterialMutation.mutate();
  };

  const handleDeleteMaterial = (materialId: string) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;
    deleteMaterialMutation.mutate(materialId);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">Study Materials</h3>
        {user?.role === 'TEACHER' && (
          <button 
            onClick={() => { setShowUploadMaterial(!showUploadMaterial); }}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Upload File
          </button>
        )}
      </div>

      {showUploadMaterial && user?.role === 'TEACHER' && (
        <form onSubmit={handleUploadMaterial} className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 shadow-sm">
          <h4 className="font-semibold text-slate-900 text-sm">Upload Study Material</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Material Title</label>
              <input 
                type="text" 
                placeholder="Enter document title (optional)" 
                value={materialTitle} 
                onChange={(e) => setMaterialTitle(e.target.value)} 
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea 
                placeholder="Enter document description (optional)" 
                value={materialDescription} 
                onChange={(e) => setMaterialDescription(e.target.value)} 
                rows={2}
                className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Select File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, PPTX, ZIP (Max 100MB)</p>
                  </div>
                  <input 
                    type="file" 
                    required 
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} 
                    className="hidden" 
                  />
                </label>
              </div>
              {selectedFile && (
                <p className="text-xs text-indigo-600 mt-2 font-semibold">
                  Selected file: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setShowUploadMaterial(false)} 
              disabled={uploadMaterialMutation.isPending}
              className="px-4 py-2 bg-white border border-slate-300 rounded-md text-slate-700 text-sm hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={uploadMaterialMutation.isPending}
              className="px-4 py-2 bg-blue-600 rounded-md text-white text-sm hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {uploadMaterialMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {uploadMaterialMutation.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      )}

      {materialsLoading ? (
        <div className="text-center py-8 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
          <span className="text-xs mt-2 block">Loading materials...</span>
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No study materials uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {materials.map((material) => (
            <div key={material.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-slate-50/50 transition">
              <div className="flex items-center gap-4 min-w-0">
                {getFileIcon(material.fileType)}
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{material.title}</h4>
                  {material.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed bg-slate-100/50 p-1.5 rounded border border-slate-100 max-w-md">
                      {material.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1.5">
                    {material.fileSize ? `${formatFileSize(material.fileSize)} • ` : ''}Uploaded {new Date(material.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <a 
                  href={material.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Download/View"
                >
                  <Download className="w-5 h-5" />
                </a>
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
  );
};
