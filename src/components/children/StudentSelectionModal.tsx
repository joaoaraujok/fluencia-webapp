import React, { useEffect, useState } from 'react';
import { X, UserPlus, Check, User, Users } from 'lucide-react';
import { Student, SchoolClass } from '../../types/school';
import { repository } from '../../services/repository';
import { api } from '../../services/api';

interface StudentSelectionModalProps {
  isOpen: boolean;
  activeStudent: Student | null;
  onClose: () => void;
  onSelectStudent: (student: Student | null) => void;
}

export const StudentSelectionModal: React.FC<StudentSelectionModalProps> = ({
  isOpen,
  activeStudent,
  onClose,
  onSelectStudent
}) => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Formulário de novo aluno
  const [name, setName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [registrationNumber, setRegistrationNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadClasses();
    }
  }, [isOpen]);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const cls = await repository.getClasses();
      setClasses(cls);
      if (cls.length > 0) {
        const initialClassId = selectedClassId || cls[0].id;
        setSelectedClassId(initialClassId);
        loadStudents(initialClassId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      const st = await repository.getStudents(classId);
      setStudents(st);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    loadStudents(classId);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedClassId) return;

    try {
      const newStudent = await api.createStudent({
        classId: selectedClassId,
        name: name.trim(),
        birthDate: birthDate || undefined,
        registrationNumber: registrationNumber.trim() || undefined,
        notes: notes.trim() || undefined
      });

      setName('');
      setBirthDate('');
      setRegistrationNumber('');
      setNotes('');
      setIsAdding(false);
      await loadStudents(selectedClassId);
      onSelectStudent(newStudent.student);
    } catch (err: any) {
      alert(err.message || 'Falha ao cadastrar estudante.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fadeIn">
      <div className="modal-content max-w-xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
                Identificação do Estudante
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Selecione a turma e o estudante para vincular os resultados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Turma */}
        {classes.length > 0 && !isAdding && (
          <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Turma Escolar:</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.gradeYear} ({c.school?.name || 'Escola'})
                </option>
              ))}
            </select>
          </div>
        )}

        {!isAdding ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Estudantes da Turma ({students.length})
              </span>
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Novo Estudante</span>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Carregando estudantes da turma...
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nenhum estudante cadastrado nesta turma ainda.
                </div>
              ) : (
                students.map((st) => {
                  const isSelected = activeStudent?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        onSelectStudent(st);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-600/30'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {st.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-800 leading-tight">{st.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {st.registrationNumber ? `Matrícula: ${st.registrationNumber}` : 'Sem matrícula informada'}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="p-1 rounded-full bg-indigo-600 text-white">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveStudent} className="space-y-3.5 animate-fadeIn">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Cadastrar Novo Estudante na Turma</span>
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva Santos"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Matrícula / ID Escolar</label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Ex: MAT-2026-44"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Observações Pedagógicas</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Participa ativamente de leituras com apoio visual..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Salvar Estudante
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
