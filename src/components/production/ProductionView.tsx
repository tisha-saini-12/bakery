import { useState, useMemo } from 'react'
import {
  ChefHat,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  Flame,
  Clock,
  Sparkles,
  Boxes,
  Layers,
  Thermometer,
  Calendar,
  AlertTriangle,
  FileCheck,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import type { ProductionBatch, BatchStatus } from '../../types'

export const ProductionView: React.FC = () => {
  const {
    batches,
    recipes,
    ingredients,
    createBatch,
    startBatch,
    advanceBatchStage,
    completeBatch,
  } = useBakeryStore()

  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Complete Batch Modal state
  const [completingBatch, setCompletingBatch] = useState<ProductionBatch | null>(null)
  const [actualYieldInput, setActualYieldInput] = useState<number>(0)
  const [scrapReasonInput, setScrapReasonInput] = useState<string>('')

  // New Batch Scheduler Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '')
  const [plannedYieldInput, setPlannedYieldInput] = useState<number>(100)
  const [assignedChefInput, setAssignedChefInput] = useState<string>('Tomas Kowalski')
  const [batchNotesInput, setBatchNotesInput] = useState<string>('')

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // BOM Explosion Calculation:
  // For all 'planned' & 'mixing' batches, calculate total raw ingredients required and compare with current warehouse stock
  const plannedBatches = batches.filter((b) => b.status === 'planned' || b.status === 'mixing')

  const bomExplosionSummary = useMemo(() => {
    const requirements: Record<string, { ingredientName: string; requiredQty: number; unit: string; currentStock: number }> = {}

    plannedBatches.forEach((batch) => {
      const recipe = recipes.find((r) => r.id === batch.recipeId)
      if (recipe) {
        const ratio = batch.plannedYield / (recipe.yieldQuantity || 1)
        recipe.ingredients.forEach((item) => {
          const ing = ingredients.find((i) => i.id === item.ingredientId)
          const ingName = ing ? ing.name : item.ingredientName || 'Ingredient'
          const currentStock = ing ? ing.currentStock : 0

          if (!requirements[item.ingredientId]) {
            requirements[item.ingredientId] = {
              ingredientName: ingName,
              requiredQty: 0,
              unit: item.unit,
              currentStock,
            }
          }
          requirements[item.ingredientId].requiredQty += Number((item.quantity * ratio).toFixed(2))
        })
      }
    })

    return Object.entries(requirements).map(([ingId, data]) => {
      const deficit = data.requiredQty > data.currentStock ? Number((data.requiredQty - data.currentStock).toFixed(2)) : 0
      return {
        ingredientId: ingId,
        ...data,
        deficit,
      }
    })
  }, [plannedBatches, recipes, ingredients])

  const hasShortages = bomExplosionSummary.some((item) => item.deficit > 0)

  // Stage definitions for the 5-stage board
  const STAGES: { key: BatchStatus; title: string; subtitle: string; color: string; badge: string; icon: React.ElementType }[] = [
    {
      key: 'planned',
      title: '1. Planned',
      subtitle: 'Awaiting dough prep',
      color: 'border-stone-300 bg-stone-50/70',
      badge: 'bg-stone-200 text-stone-800',
      icon: Calendar,
    },
    {
      key: 'mixing',
      title: '2. Dough Prep / Mixing',
      subtitle: 'Ingredients consumed & proofing',
      color: 'border-blue-300 bg-blue-50/30',
      badge: 'bg-blue-100 text-blue-800',
      icon: Clock,
    },
    {
      key: 'baking',
      title: '3. Oven / Baking',
      subtitle: 'Deck & convection baking',
      color: 'border-orange-300 bg-orange-50/30',
      badge: 'bg-orange-100 text-orange-800',
      icon: Flame,
    },
    {
      key: 'cooling',
      title: '4. Cooling / QC Check',
      subtitle: 'Cooling racks & inspection',
      color: 'border-purple-300 bg-purple-50/30',
      badge: 'bg-purple-100 text-purple-800',
      icon: Thermometer,
    },
    {
      key: 'completed',
      title: '5. Packaged / Ready',
      subtitle: 'Transferred to Finished Stock',
      color: 'border-emerald-300 bg-emerald-50/30',
      badge: 'bg-emerald-100 text-emerald-800',
      icon: FileCheck,
    },
  ]

  const handleStartBatchClick = (batch: ProductionBatch) => {
    startBatch(batch.id)
    showToast(`Batch ${batch.batchNumber} (${batch.productName}) started! Raw materials deducted from Commissary.`)
  }

  const handleOpenCompleteModal = (batch: ProductionBatch) => {
    setCompletingBatch(batch)
    setActualYieldInput(batch.plannedYield)
    setScrapReasonInput('')
  }

  const handleConfirmCompletion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!completingBatch) return

    completeBatch(
      completingBatch.id,
      actualYieldInput,
      scrapReasonInput || 'Batch passed QC and packaged'
    )

    const variance = actualYieldInput - completingBatch.plannedYield
    showToast(
      `Batch ${completingBatch.batchNumber} completed! Added ${actualYieldInput} units to Finished Stock (Variance: ${variance}).`
    )
    setCompletingBatch(null)
  }

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const recipe = recipes.find((r) => r.id === selectedRecipeId)
    if (!recipe) return

    const newB = createBatch(
      recipe.id,
      plannedYieldInput,
      new Date().toISOString().split('T')[0],
      assignedChefInput,
      batchNotesInput || 'Custom kitchen schedule'
    )

    setIsScheduleModalOpen(false)
    showToast(`Scheduled new Batch ${newB.batchNumber} for ${recipe.productName}!`)
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-orange-500 text-white shadow-xs">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">
              Commissary Production Planning & Batch Tracking
            </h2>
            <p className="text-xs text-stone-500">
              Recipe BOM explosion, automated raw ingredient consumption, 5-stage batch workflow, and yield variance tracking.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Batch</span>
        </button>
      </div>

      {/* ================= SECTION 1: BOM EXPLOSION & DEFICIT CHECK ================= */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" />
              Automated BOM Explosion: Raw Material Requirements for Today's Batches
            </h3>
            <p className="text-xs text-stone-500">
              Evaluates total raw ingredient demand against live Commissary warehouse stock before ovens are fired.
            </p>
          </div>

          {hasShortages ? (
            <span className="text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
              <AlertCircle className="w-3.5 h-3.5" />
              Ingredient Shortage Detected!
            </span>
          ) : (
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Raw Ingredients Sufficient
            </span>
          )}
        </div>

        {/* Shortage Alert Banner if any deficit */}
        {hasShortages && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <strong className="block mb-0.5">Kitchen Material Shortage Warning:</strong>
              Upcoming batches require more raw ingredients than currently in stock. Immediate purchase order needed.
            </div>
          </div>
        )}

        {/* BOM Explosion Horizontal Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {bomExplosionSummary.map((item) => (
            <div
              key={item.ingredientId}
              className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                item.deficit > 0
                  ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-200'
                  : 'bg-stone-50/70 border-stone-200'
              }`}
            >
              <span className="font-bold text-stone-900 truncate block">{item.ingredientName}</span>
              <div className="flex justify-between text-[11px] text-stone-600">
                <span>Needed:</span>
                <strong className="text-stone-900">{item.requiredQty} {item.unit}</strong>
              </div>
              <div className="flex justify-between text-[11px] text-stone-600">
                <span>In Stock:</span>
                <strong className={item.deficit > 0 ? 'text-rose-600 font-extrabold' : 'text-emerald-700'}>
                  {item.currentStock} {item.unit}
                </strong>
              </div>

              {item.deficit > 0 && (
                <div className="pt-1 border-t border-rose-200 text-[10px] text-rose-700 font-extrabold">
                  Deficit: -{item.deficit} {item.unit}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECTION 2: 5-STAGE BATCH MANAGEMENT BOARD ================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              Interactive Batch Workflow Board ({batches.length} Total Batches)
            </h3>
            <p className="text-xs text-stone-500">Advance batches step-by-step from raw dough prep to final packaging</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {STAGES.map((stage) => {
            const stageBatches = batches.filter((b) => b.status === stage.key)
            const Icon = stage.icon

            return (
              <div
                key={stage.key}
                className={`p-3.5 rounded-2xl border-2 ${stage.color} flex flex-col justify-between min-h-[500px]`}
              >
                <div>
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-4 h-4 text-stone-700" />
                        <span className="text-xs font-bold text-stone-900">{stage.title}</span>
                      </div>
                      <span className="text-[10px] text-stone-500 block mt-0.5">{stage.subtitle}</span>
                    </div>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${stage.badge}`}>
                      {stageBatches.length}
                    </span>
                  </div>

                  {/* Batch Cards in this stage */}
                  <div className="space-y-3">
                    {stageBatches.length === 0 ? (
                      <div className="text-center py-10 text-[11px] text-stone-400 italic">
                        No batches in this stage
                      </div>
                    ) : (
                      stageBatches.map((batch) => {
                        const variance = batch.variance || 0
                        return (
                          <div
                            key={batch.id}
                            className="p-3.5 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2 hover:shadow-xs transition-shadow"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono font-bold text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">
                                {batch.batchNumber}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {batch.scheduledDate}
                              </span>
                            </div>

                            <div>
                              <h4 className="font-bold text-stone-900 text-xs">{batch.productName}</h4>
                              <div className="text-[11px] text-stone-600 mt-0.5">
                                Target: <strong className="text-stone-900">{batch.plannedYield} pcs</strong>
                              </div>
                            </div>

                            {batch.actualYield !== undefined && (
                              <div className="p-2 rounded-lg bg-stone-50 border border-stone-100 text-[11px] space-y-0.5">
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Actual Baked:</span>
                                  <strong className="text-stone-900">{batch.actualYield} pcs</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Yield Scrap:</span>
                                  <strong className={variance < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                    {variance} pcs
                                  </strong>
                                </div>
                              </div>
                            )}

                            <div className="text-[10px] text-stone-500 truncate">
                              Chef: <span className="font-medium text-stone-700">{batch.assignedTo || 'Tomas Kowalski'}</span>
                            </div>

                            {/* Stage Transition Action Button */}
                            <div className="pt-2 border-t border-stone-100">
                              {batch.status === 'planned' && (
                                <button
                                  onClick={() => handleStartBatchClick(batch)}
                                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Start Batch & Deduct</span>
                                </button>
                              )}

                              {batch.status === 'mixing' && (
                                <button
                                  onClick={() => advanceBatchStage(batch.id, 'baking')}
                                  className="w-full py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Flame className="w-3.5 h-3.5" />
                                  <span>Transfer to Oven &rarr;</span>
                                </button>
                              )}

                              {batch.status === 'baking' && (
                                <button
                                  onClick={() => advanceBatchStage(batch.id, 'cooling')}
                                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Thermometer className="w-3.5 h-3.5" />
                                  <span>To Cooling Racks &rarr;</span>
                                </button>
                              )}

                              {batch.status === 'cooling' && (
                                <button
                                  onClick={() => handleOpenCompleteModal(batch)}
                                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Record Actual Yield</span>
                                </button>
                              )}

                              {batch.status === 'completed' && (
                                <div className="text-center text-[10px] font-bold text-emerald-700 bg-emerald-50 py-1 rounded">
                                  &bull; Packaged & Stocked
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ================= MODAL: RECORD ACTUAL YIELD & SCRAP ================= */}
      {completingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">
                  Complete Batch {completingBatch.batchNumber} ({completingBatch.productName})
                </h3>
                <p className="text-[11px] text-stone-500">Record final finished yield and scrap/burnt loss</p>
              </div>
              <button
                onClick={() => setCompletingBatch(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl flex justify-between items-center">
                <span className="text-stone-600">Target Planned Yield:</span>
                <span className="font-extrabold text-stone-900 text-sm">
                  {completingBatch.plannedYield} pcs
                </span>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Actual Good Yield Baked (pcs):
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={actualYieldInput}
                  onChange={(e) => setActualYieldInput(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-center text-lg font-extrabold text-stone-900"
                />
              </div>

              {/* Live Variance Calculation */}
              <div className="p-3 rounded-xl border flex justify-between items-center text-xs">
                <span>Calculated Production Scrap Variance:</span>
                <span
                  className={`font-extrabold text-sm ${
                    actualYieldInput - completingBatch.plannedYield < 0
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {actualYieldInput - completingBatch.plannedYield} pcs
                </span>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Reason for Variance / Scrap Notes:
                </label>
                <textarea
                  rows={2}
                  value={scrapReasonInput}
                  onChange={(e) => setScrapReasonInput(e.target.value)}
                  placeholder="e.g. 3 burnt during oven shift, 2 misshapen dough"
                  className="w-full p-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setCompletingBatch(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm & Transfer to Finished Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SCHEDULE NEW BATCH ================= */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Schedule New Production Batch</h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Select Product & Recipe</label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full p-2.5 border border-stone-200 rounded-xl bg-white"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.productName} (Base: {r.yieldQuantity} {r.yieldUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Target Yield (pcs)</label>
                  <input
                    type="number"
                    min={10}
                    step={10}
                    required
                    value={plannedYieldInput}
                    onChange={(e) => setPlannedYieldInput(Number(e.target.value))}
                    className="w-full p-2 border border-stone-200 rounded-lg text-center font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Assigned Baker</label>
                  <input
                    type="text"
                    value={assignedChefInput}
                    onChange={(e) => setAssignedChefInput(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Special Batch Notes / Deck Oven</label>
                <textarea
                  rows={2}
                  value={batchNotesInput}
                  onChange={(e) => setBatchNotesInput(e.target.value)}
                  placeholder="e.g. Deck Oven #2, extra steam, cold retard 14 hours"
                  className="w-full p-2 border border-stone-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl shadow-xs"
                >
                  Schedule Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
