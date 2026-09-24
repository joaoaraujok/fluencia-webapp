import React, { useEffect, useState } from 'react';
import { X, UserPlus, Check, Trash2, User } from 'lucide-react';
import { ChildProfile } from '../../types/child';
import { getChildren, saveChild, deleteChild } from '../../services/db';

interface ChildManagementModalProps {
  isOpen: boolean;
  activeChild: ChildProfile | null;
  onClose: () => void;
  onSelectChild: (child: ChildProfile | null) => void;
}

export const ChildManagementModal: React.FC<ChildManagementModalProps> = ({
  isOpen,
  activeChild,
  onClose,
  onSelectChild
}) => {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [gradeOrAge, setGradeOrAge] = useState<string>('');

  const loadList = async () => {
    try {
      const list = await getChildren();
      setChildren(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadList();
      setIsAdding(false);
      setName('');
      setGradeOrAge('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newChild: ChildProfile = {
      id: `child_${Date.now()}`,
      name: name.trim(),
      gradeOrAge: gradeOrAge.trim() || undefined,
      createdAt: Date.now()
    };

    await saveChild(newChild);
    setName('');
    setGradeOrAge('');
    setIsAdding(false);
    await loadList();
    onSelectChild(newChild);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja excluir este perfil?')) {
      await deleteChild(id);
      if (activeChild?.id === id) {
        onSelectChild(null);
      }
      await loadList();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
                Selecionar Estudante
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Vincule as avaliações ao perfil pedagógico da criança
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isAdding ? (
          <div className="space-y-4">
            <button
              onClick={() => setIsAdding(true)}
              className="btn-secondary w-full py-3 text-sm font-bold justify-center border-dashed border-indigo-300 text-indigo-700 hover:bg-indigo-50/60 transition-all shadow-2xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Nova Criança</span>
            </button>

            {/* Opção Sem Cadastro / Anônimo */}
            <div
              onClick={() => {
                onSelectChild(null);
                onClose();
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                activeChild === null
                  ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm">
                  -
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    Avaliação Avulsa (sem cadastro)
                  </div>
                  <div className="text-xs text-slate-500">
                    Não vincula a uma criança específica
                  </div>
                </div>
              </div>
              {activeChild === null && <Check className="w-5 h-5 text-indigo-600 font-bold" />}
            </div>

            {/* Lista de Crianças Cadastradas */}
            <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
              {children.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectChild(c);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    activeChild?.id === c.id
                      ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {c.name}
                      </div>
                      {c.gradeOrAge && (
                        <div className="text-xs text-slate-500">{c.gradeOrAge}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeChild?.id === c.id && (
                      <Check className="w-5 h-5 text-indigo-600 font-bold" />
                    )}
                    <button
                      onClick={(e) => handleDelete(c.id, e)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Formulário de Cadastro Simples */
          <form onSubmit={handleSaveChild} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Nome ou Apelido *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Sofia ou Lucas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Idade ou Turma (opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: 5 anos ou Pré II"
                value={gradeOrAge}
                onChange={(e) => setGradeOrAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 transition-all shadow-2xs"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                className="btn-primary flex-1 py-3 text-sm font-bold justify-center"
              >
                Salvar Estudante
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-secondary py-3 text-sm font-bold justify-center"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
