'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useGame } from '@/lib/game-context';
import { api } from '@/lib/api';
import type { Language } from '@student-journey/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface FacultyData {
  id: number;
  slug: string;
  name: any;
  description: any;
}

interface SpecialtyData {
  id: number;
  name: string;
  code?: string;
  formLabel?: string;
}

export default function FacultiesPage() {
  const { language } = useAuth();
  const { refreshProfile } = useGame();
  const [faculties, setFaculties] = useState<FacultyData[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyData[]>([]);
  
  const [selectedFacultyId, setSelectedFacultyId] = useState<number | null>(null);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(null);
  const [chosenFacultyId, setChosenFacultyId] = useState<number | null>(null);
  const [chosenSpecialtyId, setChosenSpecialtyId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [choosing, setChoosing] = useState(false);

  const lang = (language || 'ru') as Language;

  useEffect(() => {
    const init = async () => {
      try {
        const [facRes, chosenRes] = await Promise.all([
          api.get('/faculties'),
          api.get('/faculties/chosen').catch(() => null)
        ]);
        
        const rawFac = (facRes as any).data || facRes;
        setFaculties(Array.isArray(rawFac) ? rawFac : rawFac.results || []);
        
        const rawChosen = (chosenRes as any)?.data || chosenRes;
        if (rawChosen?.chosenFacultyId) {
          setChosenFacultyId(rawChosen.chosenFacultyId);
        }
        if (rawChosen?.chosenSpecialtyId) {
          setChosenSpecialtyId(rawChosen.chosenSpecialtyId);
          setSelectedSpecialtyId(rawChosen.chosenSpecialtyId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSelectFaculty = async (facultyId: number) => {
    if (selectedFacultyId === facultyId) {
      setSelectedFacultyId(null);
      setSpecialties([]);
      setSelectedSpecialtyId(null);
      return;
    }
    
    setSelectedFacultyId(facultyId);
    setSelectedSpecialtyId(null);
    setLoadingSpecialties(true);
    setSpecialties([]);
    
    try {
      const res = await api.get(`/faculties/specialties?faculty=${facultyId}`);
      const raw = (res as any).data || res;
      setSpecialties(Array.isArray(raw) ? raw : raw.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const handleChoose = async (e: React.MouseEvent, facultyId: number, specialtyId: number) => {
    e.stopPropagation();
    setChoosing(true);
    try {
      const faculty = faculties.find(f => f.id === facultyId);
      const specialty = specialties.find(s => s.id === specialtyId);
      
      const res: any = await api.post('/faculties/choose', { 
        facultyId,
        facultyName: typeof faculty?.name === 'string' ? faculty.name : null,
        specialtyId,
        specialtyName: specialty?.name || null
      });
      
      setChosenFacultyId(facultyId);
      setChosenSpecialtyId(specialtyId);
      
      if (res.data?.questCompleted) {
        await refreshProfile();
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при выборе специальности');
    } finally {
      setChoosing(false);
    }
  };

  const getName = (f: any) => {
    if (!f.name) return '';
    if (typeof f.name === 'string') return f.name;
    return lang === 'tk' ? (f.name.tk || f.name.ru) : f.name.ru;
  };
  
  const getDesc = (f: any) => {
    if (!f.description) return 'Описание временно недоступно.';
    if (typeof f.description === 'string') return f.description;
    return lang === 'tk' ? (f.description.tk || f.description.ru) : f.description.ru;
  };

  const t = {
    title: lang === 'tk' ? 'Fakultetler' : 'Факультеты',
    subtitle: lang === 'tk' ? 'Hünäriňi saýla we geljegini gur' : 'Выбери свою специальность и построй будущее',
    choose: lang === 'tk' ? 'Saýla' : 'Выбрать',
    chosen: lang === 'tk' ? 'Saýlanan' : 'Выбран',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <p className="mt-1 text-gray-500">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {faculties.map((f) => {
          const isChosen = chosenFacultyId === f.id;
          const isSelected = selectedFacultyId === f.id;
          
          return (
            <div key={f.id} className="h-max">
              <Card
                className={`relative overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary-500 shadow-md' : ''} ${isChosen && !isSelected ? 'ring-2 ring-green-500' : ''}`}
                onClick={() => handleSelectFaculty(f.id)}
              >
                {isChosen && (
                  <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div className="mt-2 text-gray-400">
                    {isSelected ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900">{getName(f)}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{getDesc(f)}</p>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Направления подготовки
                    </h4>
                    
                    {loadingSpecialties ? (
                      <div className="flex justify-center py-4">
                        <div className="spinner h-5 w-5 border-primary-500" />
                      </div>
                    ) : specialties.length > 0 ? (
                      <div className="space-y-2">
                        {specialties.map(s => {
                          const isThisChosen = chosenFacultyId === f.id && chosenSpecialtyId === s.id;
                          return (
                          <div 
                            key={s.id}
                            onClick={() => setSelectedSpecialtyId(s.id === selectedSpecialtyId ? null : s.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                              selectedSpecialtyId === s.id || isThisChosen
                                ? 'border-primary-500 bg-primary-50' 
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            <div className="flex-1 pr-2">
                              <div className={`text-sm font-medium ${selectedSpecialtyId === s.id || isThisChosen ? 'text-primary-700' : 'text-gray-900'}`}>
                                {s.name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {s.code && <span className="text-xs text-gray-500">{s.code}</span>}
                                {s.formLabel && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary-100 text-primary-700">
                                    {s.formLabel}
                                  </span>
                                )}
                              </div>
                            </div>
                            {(selectedSpecialtyId === s.id || isThisChosen) && (
                              <Check className="h-5 w-5 text-primary-600 flex-shrink-0" />
                            )}
                          </div>
                        )})}
                        
                        <Button
                          variant={chosenFacultyId === f.id && (selectedSpecialtyId === chosenSpecialtyId || !selectedSpecialtyId) ? 'secondary' : 'primary'}
                          className="w-full mt-4"
                          disabled={choosing || !selectedSpecialtyId || (chosenFacultyId === f.id && selectedSpecialtyId === chosenSpecialtyId)}
                          loading={choosing}
                          onClick={(e) => handleChoose(e, f.id, selectedSpecialtyId!)}
                        >
                          {chosenFacultyId === f.id && (selectedSpecialtyId === chosenSpecialtyId || !selectedSpecialtyId) ? t.chosen : t.choose}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">Направления не найдены</div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
