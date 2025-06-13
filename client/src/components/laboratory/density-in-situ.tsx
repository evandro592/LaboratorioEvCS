import { useState, useEffect } from "react";
import { Info, Settings, Link, Calculator, Droplet, BarChart, Save, FileText, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusIndicator from "./status-indicator";
import { calculateMoistureContent, calculateDensityInSitu } from "@/lib/calculations";
import { generateDensityInSituVerticalPDF } from "@/lib/pdf-vertical-tables";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { localDataManager } from "@/lib/local-storage";

interface DensityInSituData {
  // General Info
  registrationNumber: string;
  date: string;
  time: string;
  operator: string;
  technicalResponsible: string;
  verifier: string;
  material: string;
  origin: string;
  coordinates: string;
  quadrant: string;
  layer: string;
  balanceId: string;
  ovenId: string;
  realDensityRef: string;
  maxMinDensityRef: string;
  
  // Determinations
  det1: {
    cylinderNumber: string;
    moldeSolo: number;
    molde: number;
    volume: number;
  };
  det2: {
    cylinderNumber: string;
    moldeSolo: number;
    molde: number;
    volume: number;
  };
  
  // Moisture Top
  moistureTop1: { capsule: string; wetTare: number; dryTare: number; tare: number; };
  moistureTop2: { capsule: string; wetTare: number; dryTare: number; tare: number; };
  moistureTop3: { capsule: string; wetTare: number; dryTare: number; tare: number; };
  
  // Moisture Base
  moistureBase1: { capsule: string; wetTare: number; dryTare: number; tare: number; };
  moistureBase2: { capsule: string; wetTare: number; dryTare: number; tare: number; };
  moistureBase3: { capsule: string; wetTare: number; dryTare: number; tare: number; };
}

export default function DensityInSitu() {
  const { toast } = useToast();
  const [equipamentos, setEquipamentos] = useState<{capsulas: any[], cilindros: any[]}>({
    capsulas: [],
    cilindros: []
  });
  
  // Função para carregar dados salvos
  const loadSavedData = (): DensityInSituData => {
    try {
      const saved = localStorage.getItem('density-in-situ-progress');
      if (saved) {
        const parsedData = JSON.parse(saved);
        // Manter data e hora atuais se não houver dados salvos
        return {
          ...parsedData,
          date: parsedData.date || new Date().toISOString().split('T')[0],
          time: parsedData.time || new Date().toTimeString().slice(0, 5),
        };
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
    
    // Dados padrão se não houver salvamento
    return {
      registrationNumber: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      operator: "",
      technicalResponsible: "",
      verifier: "",
      material: "",
      origin: "",
      coordinates: "",
      quadrant: "",
      layer: "",
      balanceId: "",
      ovenId: "",
      realDensityRef: "",
      maxMinDensityRef: "",
      det1: { cylinderNumber: "", moldeSolo: 0, molde: 0, volume: 0 },
      det2: { cylinderNumber: "", moldeSolo: 0, molde: 0, volume: 0 },
      moistureTop1: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureTop2: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureTop3: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureBase1: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureBase2: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureBase3: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
    };
  };

  const [data, setData] = useState<DensityInSituData>(loadSavedData);

  // Salvamento automático sempre que os dados mudarem
  useEffect(() => {
    const saveProgress = () => {
      try {
        localStorage.setItem('density-in-situ-progress', JSON.stringify(data));
        console.log('💾 Progresso do ensaio salvo automaticamente');
      } catch (error) {
        console.error('Erro ao salvar progresso:', error);
      }
    };

    // Salvar após um pequeno delay para evitar muitas operações
    const timeoutId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [data]);

  // Carregar equipamentos ao montar o componente
  useEffect(() => {
    const loadEquipamentos = async () => {
      try {
        const [capsulas, cilindros] = await Promise.all([
          localDataManager.getCapsulas(),
          localDataManager.getCilindros()
        ]);
        setEquipamentos({ capsulas, cilindros });
      } catch (error) {
        console.error('Erro ao carregar equipamentos:', error);
      }
    };

    loadEquipamentos();
  }, []);

  // Função para buscar dados do cilindro pelo código
  const buscarDadosCilindro = (codigo: string) => {
    if (!codigo) return null;
    
    // Buscar nos cilindros de cravação usando a nova estrutura de sincronização
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('equipamento_cilindro_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const equipamento = JSON.parse(item);
            if (equipamento.tipo === 'cilindro' && 
                equipamento.codigo === codigo && 
                (equipamento.subtipo === 'biselado' || equipamento.subtipo === 'padrao')) {
              return {
                codigo: equipamento.codigo,
                peso: equipamento.peso,
                volume: equipamento.volume,
                subtipo: equipamento.subtipo
              };
            }
          } catch (error) {
            console.error('Erro ao processar equipamento:', error);
          }
        }
      }
    }
    return null;
  };

  // Função para buscar peso da cápsula pelo número
  const buscarPesoCapsula = (numero: string) => {
    if (!numero) return null;
    
    // Buscar nas cápsulas usando a nova estrutura de sincronização
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('equipamento_capsula_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const equipamento = JSON.parse(item);
            if (equipamento.tipo === 'capsula' && equipamento.codigo === numero) {
              return equipamento.peso;
            }
          } catch (error) {
            console.error('Erro ao processar equipamento:', error);
          }
        }
      }
    }
    return null;
  };

  // Handler para mudança no número do cilindro
  const handleCylinderNumberChange = (determination: 'det1' | 'det2', value: string) => {
    const dadosCilindro = buscarDadosCilindro(value);
    
    setData(prev => ({
      ...prev,
      [determination]: {
        ...prev[determination],
        cylinderNumber: value,
        molde: dadosCilindro ? dadosCilindro.peso : prev[determination].molde,
        volume: dadosCilindro ? dadosCilindro.volume : prev[determination].volume
      }
    }));

    if (dadosCilindro) {
      toast({
        title: "Cilindro de Cravação - Dados Preenchidos",
        description: `Cilindro ${dadosCilindro.codigo} (${dadosCilindro.subtipo}): Peso ${dadosCilindro.peso}g, Volume ${dadosCilindro.volume}cm³`,
      });
    }
  };

  // Handler para mudança no número da cápsula
  const handleCapsuleNumberChange = (field: string, value: string) => {
    const pesoCapsula = buscarPesoCapsula(value);
    
    if (field === 'moistureTop1') {
      setData(prev => ({
        ...prev,
        moistureTop1: {
          ...prev.moistureTop1,
          capsule: value,
          tare: pesoCapsula || prev.moistureTop1.tare
        }
      }));
    } else if (field === 'moistureTop2') {
      setData(prev => ({
        ...prev,
        moistureTop2: {
          ...prev.moistureTop2,
          capsule: value,
          tare: pesoCapsula || prev.moistureTop2.tare
        }
      }));
    } else if (field === 'moistureTop3') {
      setData(prev => ({
        ...prev,
        moistureTop3: {
          ...prev.moistureTop3,
          capsule: value,
          tare: pesoCapsula || prev.moistureTop3.tare
        }
      }));
    } else if (field === 'moistureBase1') {
      setData(prev => ({
        ...prev,
        moistureBase1: {
          ...prev.moistureBase1,
          capsule: value,
          tare: pesoCapsula || prev.moistureBase1.tare
        }
      }));
    } else if (field === 'moistureBase2') {
      setData(prev => ({
        ...prev,
        moistureBase2: {
          ...prev.moistureBase2,
          capsule: value,
          tare: pesoCapsula || prev.moistureBase2.tare
        }
      }));
    } else if (field === 'moistureBase3') {
      setData(prev => ({
        ...prev,
        moistureBase3: {
          ...prev.moistureBase3,
          capsule: value,
          tare: pesoCapsula || prev.moistureBase3.tare
        }
      }));
    }

    if (pesoCapsula) {
      toast({
        title: "Peso preenchido automaticamente",
        description: `Peso da cápsula: ${pesoCapsula}g`,
      });
    }
  };

  const [calculations, setCalculations] = useState({
    det1: { soil: 0, gammaNatWet: 0, gammaNatDry: 0 },
    det2: { soil: 0, gammaNatWet: 0, gammaNatDry: 0 },
    gammaNatDryAvg: 0,
    moistureTop: { det1: { dryWeight: 0, water: 0, moisture: 0 }, det2: { dryWeight: 0, water: 0, moisture: 0 }, det3: { dryWeight: 0, water: 0, moisture: 0 }, average: 0 },
    moistureBase: { det1: { dryWeight: 0, water: 0, moisture: 0 }, det2: { dryWeight: 0, water: 0, moisture: 0 }, det3: { dryWeight: 0, water: 0, moisture: 0 }, average: 0 },
    results: { 
      gammaDTop: 0, 
      gammaDBase: 0, 
      voidIndex: 0, 
      relativeCompactness: 0,
      voidIndexTop: 0,
      voidIndexBase: 0,
      relativeCompactnessTop: 0,
      relativeCompactnessBase: 0,
      status: "AGUARDANDO" as any 
    }
  });

  const saveTestMutation = useMutation({
    mutationFn: async (testData: any) => {
      return apiRequest("POST", "/api/tests/density-in-situ", testData);
    },
    onSuccess: () => {
      toast({ title: "Ensaio salvo com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tests/density-in-situ"] });
      // Limpar progresso salvo após salvamento bem-sucedido
      localStorage.removeItem('density-in-situ-progress');
      console.log('🗑️ Progresso do ensaio limpo após salvamento');
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao salvar ensaio", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  useEffect(() => {
    // Calculate determinations
    const det1Soil = data.det1.moldeSolo - data.det1.molde;
    const det2Soil = data.det2.moldeSolo - data.det2.molde;
    
    const det1GammaNatWet = data.det1.volume > 0 ? det1Soil / data.det1.volume : 0;
    const det2GammaNatWet = data.det2.volume > 0 ? det2Soil / data.det2.volume : 0;

    // Calculate moisture content
    const moistureTopResults = calculateMoistureContent([
      data.moistureTop1,
      data.moistureTop2,
      data.moistureTop3
    ]);

    const moistureBaseResults = calculateMoistureContent([
      data.moistureBase1,
      data.moistureBase2,
      data.moistureBase3
    ]);

    // Calculate dry densities correctly: det1 (TOPO) uses moistureTop, det2 (BASE) uses moistureBase
    const det1GammaNatDry = moistureTopResults.average > 0 ? det1GammaNatWet / (1 + moistureTopResults.average / 100) : det1GammaNatWet;
    const det2GammaNatDry = moistureBaseResults.average > 0 ? det2GammaNatWet / (1 + moistureBaseResults.average / 100) : det2GammaNatWet;
    
    // Store individual values for TOPO and BASE
    const gammaDTop = det1GammaNatDry;
    const gammaDBase = det2GammaNatDry;

    // Calculate void indices and relative compactness
    // Only calculate if we have actual data
    const gammaS = 0; // Will be filled from real density test results
    const gammaDMax = 0; // Will be filled from max/min density test results
    const gammaDMin = 0; // Will be filled from max/min density test results
    
    // Void index calculations: e = (γs/γd) - 1
    const voidIndexTop = (gammaDTop > 0 && gammaS > 0) ? (gammaS / gammaDTop) - 1 : 0;
    const voidIndexBase = (gammaDBase > 0 && gammaS > 0) ? (gammaS / gammaDBase) - 1 : 0;
    
    // Relative compactness calculations: CR = (emax - e) / (emax - emin) × 100
    let relativeCompactnessTop = 0;
    let relativeCompactnessBase = 0;
    
    if (gammaS > 0 && gammaDMax > 0 && gammaDMin > 0 && gammaDMax > gammaDMin) {
      const emax = (gammaS / gammaDMin) - 1;
      const emin = (gammaS / gammaDMax) - 1;
      
      if (emax !== emin) {
        relativeCompactnessTop = ((emax - voidIndexTop) / (emax - emin)) * 100;
        relativeCompactnessBase = ((emax - voidIndexBase) / (emax - emin)) * 100;
      }
    }

    // Average values for overall assessment
    const gammaNatDryAvg = (gammaDTop + gammaDBase) / 2;

    // Determine status
    const status: "AGUARDANDO" | "APROVADO" | "REPROVADO" = 
      gammaNatDryAvg > 1.5 ? "APROVADO" : 
      gammaNatDryAvg === 0 ? "AGUARDANDO" : "REPROVADO";

    setCalculations({
      det1: { soil: det1Soil, gammaNatWet: det1GammaNatWet, gammaNatDry: det1GammaNatDry },
      det2: { soil: det2Soil, gammaNatWet: det2GammaNatWet, gammaNatDry: det2GammaNatDry },
      gammaNatDryAvg,
      moistureTop: moistureTopResults,
      moistureBase: moistureBaseResults,
      results: {
        gammaDTop,
        gammaDBase,
        voidIndexTop,
        voidIndexBase,
        relativeCompactnessTop,
        relativeCompactnessBase,

        voidIndex: (voidIndexTop + voidIndexBase) / 2,
        relativeCompactness: (relativeCompactnessTop + relativeCompactnessBase) / 2,
        status
      }
    });
  }, [data]);

  const updateData = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedData = (parent: string, field: string, value: any) => {
    setData(prev => {
      const parentData = prev[parent as keyof DensityInSituData];
      if (typeof parentData === 'object' && parentData !== null) {
        return {
          ...prev,
          [parent]: { ...parentData, [field]: value }
        };
      }
      return prev;
    });
  };

  const handleSave = () => {
    const testData = {
      registrationNumber: data.registrationNumber,
      date: data.date,
      time: data.time,
      operator: data.operator,
      technicalResponsible: data.technicalResponsible,
      verifier: data.verifier,
      material: data.material,
      origin: data.origin,
      coordinates: data.coordinates,
      quadrant: data.quadrant,
      layer: data.layer,
      balanceId: data.balanceId,
      ovenId: data.ovenId,
      realDensityRef: data.realDensityRef,
      maxMinDensityRef: data.maxMinDensityRef,
      determinations: {
        det1: data.det1,
        det2: data.det2
      },
      moistureTop: {
        det1: data.moistureTop1,
        det2: data.moistureTop2,
        det3: data.moistureTop3
      },
      moistureBase: {
        det1: data.moistureBase1,
        det2: data.moistureBase2,
        det3: data.moistureBase3
      },
      results: calculations.results
    };

    saveTestMutation.mutate(testData);
  };

  const handleGeneratePDF = () => {
    generateDensityInSituVerticalPDF(data, calculations);
  };

  const handleClear = () => {
    setData({
      registrationNumber: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      operator: "",
      technicalResponsible: "",
      verifier: "",
      material: "",
      origin: "",
      coordinates: "",
      quadrant: "",
      layer: "",
      balanceId: "",
      ovenId: "",
      realDensityRef: "",
      maxMinDensityRef: "",
      det1: { cylinderNumber: "", moldeSolo: 0, molde: 0, volume: 0 },
      det2: { cylinderNumber: "", moldeSolo: 0, molde: 0, volume: 0 },
      moistureTop1: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureTop2: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureTop3: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureBase1: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureBase2: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
      moistureBase3: { capsule: "", wetTare: 0, dryTare: 0, tare: 0 },
    });
  };

  return (
    <div className="laboratory-page space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Densidade In Situ</h2>
        <p className="text-gray-600">Determinação da densidade natural do solo em campo</p>
      </div>

      {/* Status */}
      <StatusIndicator status={calculations.results.status} />

      {/* General Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 text-blue-600" size={20} />
            Informações Gerais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="registrationNumber">Número do Registro</Label>
              <Input
                id="registrationNumber"
                className="calculator-input"
                value={data.registrationNumber}
                onChange={(e) => updateData("registrationNumber", e.target.value)}
                placeholder="Ex: EG-001/2024"
              />
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={data.date}
                onChange={(e) => updateData("date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={data.time}
                onChange={(e) => updateData("time", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="operator">Operador</Label>
              <Input
                id="operator"
                value={data.operator}
                onChange={(e) => updateData("operator", e.target.value)}
                placeholder="Nome do operador"
              />
            </div>
            <div>
              <Label htmlFor="technicalResponsible">Responsável Técnico</Label>
              <Input
                id="technicalResponsible"
                value={data.technicalResponsible}
                onChange={(e) => updateData("technicalResponsible", e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div>
              <Label htmlFor="verifier">Verificador</Label>
              <Input
                id="verifier"
                value={data.verifier}
                onChange={(e) => updateData("verifier", e.target.value)}
                placeholder="Nome do verificador"
              />
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={data.material}
                onChange={(e) => updateData("material", e.target.value)}
                placeholder="Tipo de material"
              />
            </div>
            <div>
              <Label htmlFor="origin">Origem</Label>
              <Input
                id="origin"
                value={data.origin}
                onChange={(e) => updateData("origin", e.target.value)}
                placeholder="Local de origem"
              />
            </div>
            <div>
              <Label htmlFor="coordinates">Norte / Este / Cota</Label>
              <Input
                id="coordinates"
                value={data.coordinates}
                onChange={(e) => updateData("coordinates", e.target.value)}
                placeholder="Coordenadas"
              />
            </div>
            <div>
              <Label htmlFor="quadrant">Quadrante</Label>
              <Input
                id="quadrant"
                value={data.quadrant}
                onChange={(e) => updateData("quadrant", e.target.value)}
                placeholder="Quadrante"
              />
            </div>
            <div>
              <Label htmlFor="layer">Camada</Label>
              <Input
                id="layer"
                value={data.layer}
                onChange={(e) => updateData("layer", e.target.value)}
                placeholder="Identificação da camada"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 text-blue-600" size={20} />
            Dispositivos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="balanceId">Identificação da Balança</Label>
              <Input
                id="balanceId"
                value={data.balanceId}
                onChange={(e) => updateData("balanceId", e.target.value)}
                placeholder="Ex: BAL-001"
              />
            </div>
            <div>
              <Label htmlFor="ovenId">Identificação da Estufa</Label>
              <Input
                id="ovenId"
                value={data.ovenId}
                onChange={(e) => updateData("ovenId", e.target.value)}
                placeholder="Ex: EST-001"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* References */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="mr-2 text-blue-600" size={20} />
            Referências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="realDensityRef">Registro de Densidade Real</Label>
              <Select value={data.realDensityRef} onValueChange={(value) => updateData("realDensityRef", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar registro..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum registro selecionado</SelectItem>
                  {/* TODO: Carregar ensaios de densidade real salvos */}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxMinDensityRef">Registro de Densidade Máx/Mín</Label>
              <Select value={data.maxMinDensityRef} onValueChange={(value) => updateData("maxMinDensityRef", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar registro..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum registro selecionado</SelectItem>
                  {/* TODO: Carregar ensaios de densidade máx/mín salvos */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Density In Situ Determinations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="mr-2 text-blue-600" size={20} />
            Densidade In Situ (2 Determinações)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 md:p-6">
          <div className="mobile-responsive-table">
            <Table className="table-compact">
              <TableHeader>
                <TableRow className="bg-gray-50">
                <TableHead className="text-left">Campo</TableHead>
                <TableHead className="text-center">Det 1</TableHead>
                <TableHead className="text-center">Det 2</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Cilindro de Cravação</TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    value={data.det1.cylinderNumber || ""}
                    onChange={(e) => handleCylinderNumberChange("det1", e.target.value)}
                    placeholder="CIL-01"
                    className="calculator-input"
                  />
                </TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    value={data.det2.cylinderNumber || ""}
                    onChange={(e) => handleCylinderNumberChange("det2", e.target.value)}
                    placeholder="CIL-02"
                    className="calculator-input"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Molde + Solo (g)</TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    type="number"
                    step="0.01"
                    className="calculator-number-input"
                    value={data.det1.moldeSolo || ""}
                    onChange={(e) => updateNestedData("det1", "moldeSolo", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    type="number"
                    step="0.01"
                    className="calculator-number-input"
                    value={data.det2.moldeSolo || ""}
                    onChange={(e) => updateNestedData("det2", "moldeSolo", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Molde (g)</TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    type="number"
                    step="0.01"
                    className="calculator-number-input"
                    value={data.det1.molde || ""}
                    onChange={(e) => updateNestedData("det1", "molde", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    type="number"
                    step="0.01"
                    className="calculator-number-input"
                    value={data.det2.molde || ""}
                    onChange={(e) => updateNestedData("det2", "molde", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </TableCell>
              </TableRow>
              <TableRow className="bg-blue-50">
                <TableCell className="font-medium">Solo (g) <Calculator className="inline ml-1" size={12} /></TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={calculations.det1.soil.toFixed(2)}
                    readOnly
                    className="bg-blue-50 border-blue-200 font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.01"
                    value={calculations.det2.soil.toFixed(2)}
                    readOnly
                    className="bg-blue-50 border-blue-200 font-mono"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Volume (cm³)</TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    type="number"
                    step="0.01"
                    className="calculator-number-input"
                    value={data.det1.volume || ""}
                    onChange={(e) => updateNestedData("det1", "volume", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </TableCell>
                <TableCell className="mobile-table-cell">
                  <Input
                    type="number"
                    step="0.01"
                    className="calculator-number-input"
                    value={data.det2.volume || ""}
                    onChange={(e) => updateNestedData("det2", "volume", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </TableCell>
              </TableRow>
              <TableRow className="bg-blue-50">
                <TableCell className="font-medium">γnat úmido (g/cm³) <Calculator className="inline ml-1" size={12} /></TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.001"
                    value={calculations.det1.gammaNatWet.toFixed(3)}
                    readOnly
                    className="bg-blue-50 border-blue-200 font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.001"
                    value={calculations.det2.gammaNatWet.toFixed(3)}
                    readOnly
                    className="bg-blue-50 border-blue-200 font-mono"
                  />
                </TableCell>
              </TableRow>
              <TableRow className="bg-blue-50">
                <TableCell className="font-medium">γnat seco (g/cm³) <Calculator className="inline ml-1" size={12} /></TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.001"
                    value={calculations.det1.gammaNatDry.toFixed(3)}
                    readOnly
                    className="bg-blue-50 border-blue-200 font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="0.001"
                    value={calculations.det2.gammaNatDry.toFixed(3)}
                    readOnly
                    className="bg-blue-50 border-blue-200 font-mono"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Média γnat seco (g/cm³):</span>
              <span className="text-lg font-bold text-blue-600 font-mono">{calculations.gammaNatDryAvg.toFixed(3)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moisture Content Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moisture Top */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplet className="mr-2 text-blue-600" size={20} />
              Teor de Umidade - Topo (3 Det.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-left">Det.</TableHead>
                  <TableHead className="text-center">1</TableHead>
                  <TableHead className="text-center">2</TableHead>
                  <TableHead className="text-center">3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Cápsula Nº</TableCell>
                  <TableCell className="mobile-table-cell"><Input value={data.moistureTop1.capsule} onChange={(e) => handleCapsuleNumberChange("moistureTop1", e.target.value)} placeholder="C-01" className="text-xs" /></TableCell>
                  <TableCell className="mobile-table-cell"><Input value={data.moistureTop2.capsule} onChange={(e) => handleCapsuleNumberChange("moistureTop2", e.target.value)} placeholder="C-02" className="text-xs" /></TableCell>
                  <TableCell className="mobile-table-cell"><Input value={data.moistureTop3.capsule} onChange={(e) => handleCapsuleNumberChange("moistureTop3", e.target.value)} placeholder="C-03" className="text-xs" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Solo Úmido+Tara</TableCell>
                  <TableCell className="mobile-table-cell"><Input type="number" step="0.01" value={data.moistureTop1.wetTare || ""} onChange={(e) => updateNestedData("moistureTop1", "wetTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell className="mobile-table-cell"><Input type="number" step="0.01" value={data.moistureTop2.wetTare || ""} onChange={(e) => updateNestedData("moistureTop2", "wetTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell className="mobile-table-cell"><Input type="number" step="0.01" value={data.moistureTop3.wetTare || ""} onChange={(e) => updateNestedData("moistureTop3", "wetTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Solo Seco+Tara</TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureTop1.dryTare || ""} onChange={(e) => updateNestedData("moistureTop1", "dryTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureTop2.dryTare || ""} onChange={(e) => updateNestedData("moistureTop2", "dryTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureTop3.dryTare || ""} onChange={(e) => updateNestedData("moistureTop3", "dryTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Tara</TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureTop1.tare || ""} onChange={(e) => updateNestedData("moistureTop1", "tare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureTop2.tare || ""} onChange={(e) => updateNestedData("moistureTop2", "tare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureTop3.tare || ""} onChange={(e) => updateNestedData("moistureTop3", "tare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                </TableRow>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium">Solo Seco (g)</TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det1.dryWeight.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det2.dryWeight.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det3.dryWeight.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                </TableRow>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium">Água (g)</TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det1.water.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det2.water.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det3.water.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                </TableRow>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium">Umidade (%)</TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det1.moisture.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det2.moisture.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureTop.det3.moisture.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Umidade Média Topo (%):</span>
                <span className="text-base font-bold text-blue-600 font-mono">{calculations.moistureTop.average.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moisture Base */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplet className="mr-2 text-blue-600" size={20} />
              Teor de Umidade - Base (3 Det.)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-left">Det.</TableHead>
                  <TableHead className="text-center">1</TableHead>
                  <TableHead className="text-center">2</TableHead>
                  <TableHead className="text-center">3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Cápsula Nº</TableCell>
                  <TableCell><Input value={data.moistureBase1.capsule} onChange={(e) => handleCapsuleNumberChange("moistureBase1", e.target.value)} placeholder="C-04" className="text-xs" /></TableCell>
                  <TableCell><Input value={data.moistureBase2.capsule} onChange={(e) => handleCapsuleNumberChange("moistureBase2", e.target.value)} placeholder="C-05" className="text-xs" /></TableCell>
                  <TableCell><Input value={data.moistureBase3.capsule} onChange={(e) => handleCapsuleNumberChange("moistureBase3", e.target.value)} placeholder="C-06" className="text-xs" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Solo Úmido+Tara</TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase1.wetTare || ""} onChange={(e) => updateNestedData("moistureBase1", "wetTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase2.wetTare || ""} onChange={(e) => updateNestedData("moistureBase2", "wetTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase3.wetTare || ""} onChange={(e) => updateNestedData("moistureBase3", "wetTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Solo Seco+Tara</TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase1.dryTare || ""} onChange={(e) => updateNestedData("moistureBase1", "dryTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase2.dryTare || ""} onChange={(e) => updateNestedData("moistureBase2", "dryTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase3.dryTare || ""} onChange={(e) => updateNestedData("moistureBase3", "dryTare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Tara</TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase1.tare || ""} onChange={(e) => updateNestedData("moistureBase1", "tare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase2.tare || ""} onChange={(e) => updateNestedData("moistureBase2", "tare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={data.moistureBase3.tare || ""} onChange={(e) => updateNestedData("moistureBase3", "tare", parseFloat(e.target.value) || 0)} className="text-xs" /></TableCell>
                </TableRow>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium">Solo Seco (g)</TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det1.dryWeight.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det2.dryWeight.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det3.dryWeight.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                </TableRow>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium">Água (g)</TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det1.water.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det2.water.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det3.water.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                </TableRow>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-medium">Umidade (%)</TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det1.moisture.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det2.moisture.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                  <TableCell><Input type="number" step="0.01" value={calculations.moistureBase.det3.moisture.toFixed(2)} readOnly className="bg-blue-50 border-blue-200 font-mono text-xs" /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Umidade Média Base (%):</span>
                <span className="text-base font-bold text-blue-600 font-mono">{calculations.moistureBase.average.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart className="mr-2 text-blue-600" size={20} />
            Resultados Finais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm text-blue-700 mb-1 font-medium">γd Topo (g/cm³)</div>
              <div className="text-xl font-bold text-blue-800 font-mono">{calculations.results.gammaDTop.toFixed(3)}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <div className="text-sm text-green-700 mb-1 font-medium">γd Base (g/cm³)</div>
              <div className="text-xl font-bold text-green-800 font-mono">{calculations.results.gammaDBase.toFixed(3)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-500">
              <div className="text-sm text-gray-700 mb-1 font-medium">γd Médio (g/cm³)</div>
              <div className="text-xl font-bold text-gray-800 font-mono">{calculations.gammaNatDryAvg.toFixed(3)}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-700 border-b border-blue-200 pb-2">Resultados Topo</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-700 mb-1">Índice de Vazios Topo (e)</div>
                  <div className="text-lg font-bold text-blue-800 font-mono">{calculations.results.voidIndexTop?.toFixed(3) || '0.000'}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-700 mb-1">Compacidade Relativa Topo (%)</div>
                  <div className="text-lg font-bold text-blue-800 font-mono">{calculations.results.relativeCompactnessTop?.toFixed(1) || '0.0'}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-green-700 border-b border-green-200 pb-2">Resultados Base</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-700 mb-1">Índice de Vazios Base (e)</div>
                  <div className="text-lg font-bold text-green-800 font-mono">{calculations.results.voidIndexBase?.toFixed(3) || '0.000'}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-700 mb-1">Compacidade Relativa Base (%)</div>
                  <div className="text-lg font-bold text-green-800 font-mono">{calculations.results.relativeCompactnessBase?.toFixed(1) || '0.0'}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleSave}
              disabled={saveTestMutation.isPending}
              className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2" size={16} />
              {saveTestMutation.isPending ? "Salvando..." : "Salvar Ensaio"}
            </Button>
            <Button 
              onClick={handleGeneratePDF}
              className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700"
            >
              <FileText className="mr-2" size={16} />
              Gerar PDF
            </Button>
            <Button 
              onClick={handleClear}
              variant="outline"
              className="flex-1 min-w-[200px]"
            >
              <RotateCcw className="mr-2" size={16} />
              Limpar Dados
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
