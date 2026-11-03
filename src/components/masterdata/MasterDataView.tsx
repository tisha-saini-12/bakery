import { useState } from 'react'
import {
  Database,
  ChefHat,
  Boxes,
  Plus,
  Search,
  Check,
  AlertCircle,
  Clock,
  ArrowRight,
  Scale,
  Package,
} from 'lucide-react'
import { useBakeryStore } from '../../store/useBakeryStore'
import { formatCurrency } from '../../lib/utils'
import type { Product, Ingredient, RecipeItem } from '../../types'

export const MasterDataView: React.FC = () => {
  const { products, ingredients, recipes, addProduct, addIngredient, saveRecipe } = useBakeryStore()

  const [activeTab, setActiveTab] = useState<'products' | 'ingredients' | 'recipes'>('recipes')

  // Search & Filter
  const [productSearch, setProductSearch] = useState('')
  const [productCategory, setProductCategory] = useState('All')
  const [ingredientSearch, setIngredientSearch] = useState('')

  // New Product Modal State
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false)
  const [newProductData, setNewProductData] = useState({
    name: '',
    code: '',
    category: 'Pastries' as Product['category'],
    unit: 'pcs',
    retailPrice: 4.0,
    wholesalePrice: 2.5,
    costPrice: 1.2,
    minStockLevel: 20,
    currentStock: 0,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
  })

  // New Ingredient Modal State
  const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false)
  const [newIngredientData, setNewIngredientData] = useState({
    name: '',
    code: '',
    unit: 'kg' as Ingredient['unit'],
    currentStock: 50.0,
    minStockLevel: 25.0,
    unitCost: 2.5,
    supplier: '',
  })

  // Recipe Builder State
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '')
  const [customBatchYield, setCustomBatchYield] = useState<number>(recipes[0]?.yieldQuantity || 100)
  const [isAddingIngredientRow, setIsAddingIngredientRow] = useState(false)
  const [newRowIngredientId, setNewRowIngredientId] = useState<string>(ingredients[0]?.id || '')
  const [newRowQuantity, setNewRowQuantity] = useState<number>(1.0)
  const [recipeSavedToast, setRecipeSavedToast] = useState(false)

  const activeRecipe = recipes.find((r) => r.id === selectedRecipeId) || recipes[0]

  // Recipe Scaling calculation
  const yieldRatio = activeRecipe ? customBatchYield / (activeRecipe.yieldQuantity || 1) : 1

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase())
    const matchesCategory = productCategory === 'All' || p.category === productCategory
    return matchesSearch && matchesCategory
  })

  // Filtered Ingredients
  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
    i.code.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
    i.supplier.toLowerCase().includes(ingredientSearch.toLowerCase())
  )

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProductData.name || !newProductData.code) return
    addProduct(newProductData)
    setIsNewProductModalOpen(false)
  }

  const handleAddIngredientSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIngredientData.name || !newIngredientData.code) return
    addIngredient(newIngredientData)
    setIsNewIngredientModalOpen(false)
  }

  const handleSaveRecipeRow = () => {
    if (!activeRecipe) return
    const ing = ingredients.find((i) => i.id === newRowIngredientId)
    if (!ing) return

    const updatedIngredients: RecipeItem[] = [
      ...activeRecipe.ingredients,
      {
        ingredientId: ing.id,
        ingredientName: ing.name,
        quantity: newRowQuantity,
        unit: ing.unit,
      },
    ]

    saveRecipe({
      ...activeRecipe,
      ingredients: updatedIngredients,
    })
    setIsAddingIngredientRow(false)
    setRecipeSavedToast(true)
    setTimeout(() => setRecipeSavedToast(false), 2500)
  }

  const handleRemoveRecipeIngredient = (ingredientId: string) => {
    if (!activeRecipe) return
    const updatedIngredients = activeRecipe.ingredients.filter((i) => i.ingredientId !== ingredientId)
    saveRecipe({
      ...activeRecipe,
      ingredients: updatedIngredients,
    })
    setRecipeSavedToast(true)
    setTimeout(() => setRecipeSavedToast(false), 2500)
  }

  // Calculate Batch Estimated Ingredient Cost
  const totalBatchCost = activeRecipe
    ? activeRecipe.ingredients.reduce((sum, item) => {
        const ing = ingredients.find((i) => i.id === item.ingredientId)
        const unitCost = ing ? ing.unitCost : 0
        return sum + item.quantity * yieldRatio * unitCost
      }, 0)
    : 0

  const costPerUnit = customBatchYield > 0 ? totalBatchCost / customBatchYield : 0

  return (
    <div className="space-y-6">
      {/* Toast */}
      {recipeSavedToast && (
        <div className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-amber-500/30 flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">Recipe Bill of Materials (BOM) saved successfully!</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500 text-stone-950 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Master Data & Recipe Formulator (BOM)</h2>
            <p className="text-xs text-stone-500">
              Manage finished bakery SKUs, raw ingredients with conversions, and interactive batch formulation.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('recipes')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'recipes'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5 inline mr-1.5 text-amber-600" />
            Recipe BOM Formulator
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'products'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Package className="w-3.5 h-3.5 inline mr-1.5 text-blue-600" />
            Products Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ingredients'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 inline mr-1.5 text-orange-600" />
            Raw Ingredients ({ingredients.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: RECIPE BOM BUILDER ================= */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Recipe Selection & Formulation Controls (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Select Recipe to Formulate
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {recipes.length} Formulations
                </span>
              </div>

              <div className="space-y-1.5">
                {recipes.map((rcp) => {
                  const isSelected = rcp.id === selectedRecipeId
                  return (
                    <button
                      key={rcp.id}
                      onClick={() => {
                        setSelectedRecipeId(rcp.id)
                        setCustomBatchYield(rcp.yieldQuantity)
                      }}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-stone-950 font-bold shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          <ChefHat className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-stone-900">{rcp.productName}</div>
                          <span className="text-[10px] text-stone-500 font-normal">
                            Base: {rcp.yieldQuantity} {rcp.yieldUnit} &bull; {rcp.ingredients.length} items
                          </span>
                        </div>
                      </div>
                      {isSelected && <ArrowRight className="w-4 h-4 text-amber-600" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dynamic Batch Yield Scaling Box */}
            {activeRecipe && (
              <div className="bg-gradient-to-br from-stone-900 to-stone-850 text-white p-5 rounded-2xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Dynamic Batch Scaler
                    </span>
                  </div>
                  <span className="text-[10px] bg-stone-700 px-2 py-0.5 rounded text-stone-300 font-mono">
                    Factor: {yieldRatio.toFixed(2)}x
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-stone-300 block mb-1">
                    Target Batch Yield ({activeRecipe.yieldUnit}):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={customBatchYield}
                      onChange={(e) => setCustomBatchYield(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-sm font-extrabold text-white text-center focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      onClick={() => setCustomBatchYield(activeRecipe.yieldQuantity)}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-[11px] font-semibold text-stone-300 rounded-xl border border-stone-700 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Quick Multiplier Presets */}
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {[50, 100, 200, 500].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setCustomBatchYield(preset)}
                      className={`py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        customBatchYield === preset
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-xs'
                          : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                      }`}
                    >
                      {preset} pcs
                    </button>
                  ))}
                </div>

                <div className="pt-3 border-t border-stone-700 space-y-1 text-xs">
                  <div className="flex justify-between text-stone-400">
                    <span>Batch Ingredient Cost:</span>
                    <strong className="text-white">{formatCurrency(totalBatchCost)}</strong>
                  </div>
                  <div className="flex justify-between text-stone-400">
                    <span>Raw Cost Per Unit:</span>
                    <strong className="text-amber-400">{formatCurrency(costPerUnit)}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recipe Bill of Materials Breakdown (8 cols) */}
          {activeRecipe && (
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-stone-900">{activeRecipe.productName} BOM</h3>
                      <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        Target Yield: {customBatchYield} {activeRecipe.yieldUnit}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Base formula: {activeRecipe.yieldQuantity} {activeRecipe.yieldUnit} &bull; Preparation: {activeRecipe.preparationTimeMinutes} min &bull; Bake Time: {activeRecipe.bakingTimeMinutes} min
                    </p>
                  </div>

                  <button
                    onClick={() => setIsAddingIngredientRow(true)}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                {/* Add Ingredient In-line Form */}
                {isAddingIngredientRow && (
                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in duration-150">
                    <span className="text-xs font-bold text-stone-900 block">Add Raw Ingredient to Formulation:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-6">
                        <select
                          value={newRowIngredientId}
                          onChange={(e) => setNewRowIngredientId(e.target.value)}
                          className="w-full text-xs rounded-lg border border-stone-300 bg-white p-2 focus:ring-1 focus:ring-amber-500"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit}) - {formatCurrency(ing.unitCost)}/{ing.unit}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          step={0.1}
                          min={0.01}
                          value={newRowQuantity}
                          onChange={(e) => setNewRowQuantity(Number(e.target.value))}
                          placeholder="Base Quantity"
                          className="w-full text-xs rounded-lg border border-stone-300 bg-white p-2 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="sm:col-span-3 flex gap-2">
                        <button
                          onClick={handleSaveRecipeRow}
                          className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg shadow-2xs"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setIsAddingIngredientRow(false)}
                          className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-semibold text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recipe Ingredients Dynamic Scaled Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                      <tr>
                        <th className="py-3 px-3">Ingredient</th>
                        <th className="py-3 px-3">Standard Base Qty ({activeRecipe.yieldQuantity} pcs)</th>
                        <th className="py-3 px-3">Scaled Requirement ({customBatchYield} pcs)</th>
                        <th className="py-3 px-3">Commissary Stock</th>
                        <th className="py-3 px-3">Est. Line Cost</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {activeRecipe.ingredients.map((item) => {
                        const ing = ingredients.find((i) => i.id === item.ingredientId)
                        const ingName = ing ? ing.name : item.ingredientName || 'Unknown Ingredient'
                        const currentWarehouseStock = ing ? ing.currentStock : 0
                        const scaledQty = Number((item.quantity * yieldRatio).toFixed(2))
                        const isStockDeficit = currentWarehouseStock < scaledQty
                        const lineCost = (ing ? ing.unitCost : 0) * scaledQty

                        return (
                          <tr key={item.ingredientId} className="hover:bg-stone-50/70">
                            <td className="py-3 px-3">
                              <span className="font-semibold text-stone-900 block">{ingName}</span>
                              <span className="text-[10px] text-stone-400 font-mono">
                                Unit: {item.unit}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-700">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-stone-950">
                              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg border border-amber-200">
                                {scaledQty} {item.unit}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-semibold ${
                                  isStockDeficit ? 'text-rose-600 font-bold' : 'text-emerald-700'
                                }`}
                              >
                                {currentWarehouseStock} {item.unit}
                                {isStockDeficit && (
                                  <span className="ml-1 text-[9px] bg-rose-100 text-rose-700 px-1 rounded uppercase font-bold">
                                    Deficit!
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-stone-900">
                              {formatCurrency(lineCost)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => handleRemoveRecipeIngredient(item.ingredientId)}
                                className="text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Baking / Preparation Method */}
                {activeRecipe.instructions && (
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      Baker Preparation & Oven Instructions:
                    </span>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {activeRecipe.instructions}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: PRODUCTS CATALOG ================= */}
      {activeTab === 'products' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {['All', 'Breads', 'Pastries', 'Cakes', 'Beverages'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    productCategory === cat
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search name or SKU..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Product</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">SKU Code</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Retail Price</th>
                  <th className="py-3 px-3">Wholesale Price</th>
                  <th className="py-3 px-3">Cost Price</th>
                  <th className="py-3 px-3">Margin %</th>
                  <th className="py-3 px-3">Commissary Stock</th>
                  <th className="py-3 px-3">Recipe Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const marginPct =
                    p.retailPrice > 0 ? (((p.retailPrice - p.costPrice) / p.retailPrice) * 100).toFixed(0) : '0'

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover ring-1 ring-stone-200"
                          />
                          <span className="font-bold text-stone-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-700">{p.code}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-extrabold text-stone-900">{formatCurrency(p.retailPrice)}</td>
                      <td className="py-3 px-3 text-stone-600">{formatCurrency(p.wholesalePrice)}</td>
                      <td className="py-3 px-3 text-stone-500">{formatCurrency(p.costPrice)}</td>
                      <td className="py-3 px-3 font-bold text-emerald-700">{marginPct}%</td>
                      <td className="py-3 px-3 font-bold text-stone-800">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="py-3 px-3">
                        {p.recipeId ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            BOM Linked
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-stone-400">Unlinked</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: RAW INGREDIENTS ================= */}
      {activeTab === 'ingredients' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          {/* Unit Conversion Reference Banner */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-amber-950">Unit-of-Measure Conversions Guide:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-amber-900">
              <span className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono">
                1 kg = 1,000 g
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono">
                1 L = 1,000 ml
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono">
                1 Bag Flour = 25 kg
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono">
                1 Crate Butter = 20 kg
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                placeholder="Search ingredient or supplier..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => setIsNewIngredientModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ingredient</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider font-bold text-[10px] border-y border-stone-200">
                <tr>
                  <th className="py-3 px-3">Ingredient</th>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Warehouse Stock</th>
                  <th className="py-3 px-3">Min Reorder Level</th>
                  <th className="py-3 px-3">Unit Cost</th>
                  <th className="py-3 px-3">Primary Supplier</th>
                  <th className="py-3 px-3">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredIngredients.map((ing) => {
                  const isLow = ing.currentStock <= ing.minStockLevel
                  return (
                    <tr key={ing.id} className="hover:bg-stone-50/70">
                      <td className="py-3 px-3 font-bold text-stone-900">{ing.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-700">{ing.code}</td>
                      <td className="py-3 px-3 uppercase font-semibold text-stone-600">{ing.unit}</td>
                      <td className={`py-3 px-3 font-extrabold ${isLow ? 'text-rose-600' : 'text-stone-900'}`}>
                        {ing.currentStock} {ing.unit}
                      </td>
                      <td className="py-3 px-3 text-stone-500">{ing.minStockLevel} {ing.unit}</td>
                      <td className="py-3 px-3 font-bold text-stone-900">{formatCurrency(ing.unitCost)}</td>
                      <td className="py-3 px-3 text-stone-600">{ing.supplier}</td>
                      <td className="py-3 px-3">
                        {isLow ? (
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" /> Reorder Alert
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full w-fit inline-block">
                            Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Add New Bakery Product</h3>
              <button
                onClick={() => setIsNewProductModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={newProductData.name}
                  onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                  placeholder="e.g. Pistachio Cardamom Roll"
                  className="w-full p-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={newProductData.code}
                    onChange={(e) => setNewProductData({ ...newProductData, code: e.target.value })}
                    placeholder="PRD-CR-09"
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    value={newProductData.category}
                    onChange={(e) =>
                      setNewProductData({ ...newProductData, category: e.target.value as Product['category'] })
                    }
                    className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="Breads">Breads</option>
                    <option value="Pastries">Pastries</option>
                    <option value="Cakes">Cakes</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Retail Price ($)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newProductData.retailPrice}
                    onChange={(e) => setNewProductData({ ...newProductData, retailPrice: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Wholesale ($)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newProductData.wholesalePrice}
                    onChange={(e) => setNewProductData({ ...newProductData, wholesalePrice: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newProductData.costPrice}
                    onChange={(e) => setNewProductData({ ...newProductData, costPrice: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Ingredient Modal */}
      {isNewIngredientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">Register New Raw Ingredient</h3>
              <button
                onClick={() => setIsNewIngredientModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddIngredientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={newIngredientData.name}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, name: e.target.value })}
                  placeholder="e.g. Sicilian Pistachio Paste"
                  className="w-full p-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Code</label>
                  <input
                    type="text"
                    required
                    value={newIngredientData.code}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, code: e.target.value })}
                    placeholder="ING-PIST-09"
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Unit of Measure</label>
                  <select
                    value={newIngredientData.unit}
                    onChange={(e) =>
                      setNewIngredientData({ ...newIngredientData, unit: e.target.value as Ingredient['unit'] })
                    }
                    className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="L">L (Liter)</option>
                    <option value="ml">ml (Milliliter)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="bags">bags (Bags)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={newIngredientData.unitCost}
                    onChange={(e) => setNewIngredientData({ ...newIngredientData, unitCost: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Min Safety Level</label>
                  <input
                    type="number"
                    value={newIngredientData.minStockLevel}
                    onChange={(e) =>
                      setNewIngredientData({ ...newIngredientData, minStockLevel: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Primary Supplier</label>
                <input
                  type="text"
                  value={newIngredientData.supplier}
                  onChange={(e) => setNewIngredientData({ ...newIngredientData, supplier: e.target.value })}
                  placeholder="e.g. Agrimontana Imports"
                  className="w-full p-2 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewIngredientModalOpen(false)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shadow-xs"
                >
                  Register Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
