import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, Plus, Trash2, Download, Edit2, Check, X, ShoppingCart,
  Tag, Eye, MoreHorizontal, FileSpreadsheet, Image as ImageIcon, Share2
} from "lucide-react";
import type { PriceList, PriceListItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const EXPORT_PRESET_KEY = "export_dimensions";

const DEFAULT_LISTS = [
  { icon: <ShoppingCart className="w-4 h-4" />, label: "待购清单" },
  { icon: <Tag className="w-4 h-4" />, label: "出售清单" },
  { icon: <Eye className="w-4 h-4" />, label: "收藏观察" },
];

const EXPORT_DIMENSIONS = [
  { key: "name_cn", label: "中文名称", default: true },
  { key: "name_en", label: "英文名称", default: true },
  { key: "name_jp", label: "日文名称", default: false },
  { key: "type_line", label: "类别", default: false },
  { key: "set", label: "系列", default: true },
  { key: "rarity", label: "稀有度", default: false },
  { key: "oracle_text", label: "规则文本", default: false },
  { key: "mana_cost", label: "法术力费用", default: false },
  { key: "colors", label: "颜色", default: false },
  { key: "quantity", label: "数量", default: true },
  { key: "condition", label: "品相", default: true },
  { key: "price_tcg", label: "TCGPlayer (USD)", default: true },
  { key: "price_tcg_cny", label: "TCGPlayer (≈CNY)", default: true },
  { key: "price_hareruya", label: "晴屋 Hareruya (JPY)", default: false },
  { key: "price_hareruya_cny", label: "晴屋 Hareruya (≈CNY)", default: false },
  { key: "price_cn", label: "中国市场 (CNY)", default: true },
  { key: "subtotal", label: "小计 (CNY)", default: true },
  { key: "notes", label: "备注", default: false },
];

const USD_TO_CNY = 7.25;
const JPY_TO_CNY = 0.048;

export default function PriceLists() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [newListName, setNewListName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState("");
  const [editCondition, setEditCondition] = useState("NM");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportConfig, setShowExportConfig] = useState<"csv" | "image" | null>(null);
  const [exportDimensions, setExportDimensions] = useState<string[]>(
    EXPORT_DIMENSIONS.filter(d => d.default).map(d => d.key)
  );
  const [showSavePresetDialog, setShowSavePresetDialog] = useState(false);
  const [pendingExportDims, setPendingExportDims] = useState<string[]>([]);

  const { data: savedPreset } = useQuery<{ key: string; value: string | null }>({
    queryKey: ["/api/settings", EXPORT_PRESET_KEY],
    queryFn: async () => {
      const res = await fetch(`/api/settings/${EXPORT_PRESET_KEY}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (savedPreset?.value) {
      try {
        const dims = JSON.parse(savedPreset.value) as string[];
        if (dims.length > 0) setExportDimensions(dims);
      } catch {}
    }
  }, [savedPreset]);

  const savePresetApi = useMutation({
    mutationFn: async (dims: string[]) => {
      return apiRequest("PUT", `/api/settings/${EXPORT_PRESET_KEY}`, { value: JSON.stringify(dims) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings", EXPORT_PRESET_KEY] });
      toast({ title: "已保存", description: "导出字段组合已保存为默认" });
    },
  });

  const { data: lists = [] } = useQuery<PriceList[]>({
    queryKey: ["/api/price-lists"],
  });

  const { data: items = [] } = useQuery<PriceListItem[]>({
    queryKey: ["/api/price-lists", selectedListId, "items"],
    queryFn: async () => {
      if (!selectedListId) return [];
      const res = await fetch(`/api/price-lists/${selectedListId}/items`);
      return res.json();
    },
    enabled: !!selectedListId,
  });

  const createList = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/price-lists", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      setNewListName("");
      setShowCreateForm(false);
    },
  });

  const deleteList = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/price-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      if (selectedListId) setSelectedListId(null);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/price-list-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists", selectedListId, "items"] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PriceListItem> }) => {
      return apiRequest("PATCH", `/api/price-list-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists", selectedListId, "items"] });
      setEditingItemId(null);
    },
  });

  const totalValue = items.reduce((sum, item) => {
    return sum + (item.priceCny || 0) * item.quantity;
  }, 0);

  const handleCreateDefaults = async () => {
    for (const d of DEFAULT_LISTS) {
      await createList.mutateAsync(d.label);
    }
  };

  const toggleDimension = (key: string) => {
    setExportDimensions(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const getItemValue = (item: PriceListItem, key: string): string => {
    switch (key) {
      case "name_cn": return item.cardNameCn || "-";
      case "name_en": return item.cardName;
      case "name_jp": return "-";
      case "type_line": return "-";
      case "set": return item.cardSetCode || "-";
      case "rarity": return "-";
      case "oracle_text": return "-";
      case "mana_cost": return "-";
      case "colors": return "-";
      case "quantity": return item.quantity.toString();
      case "condition": return item.condition || "NM";
      case "price_tcg": return item.priceUsd ? `$${item.priceUsd}` : "-";
      case "price_tcg_cny": return item.priceUsd ? `¥${(item.priceUsd * USD_TO_CNY).toFixed(2)}` : "-";
      case "price_hareruya": return item.priceJpy ? `¥${item.priceJpy.toLocaleString()}` : "-";
      case "price_hareruya_cny": return item.priceJpy ? `¥${(item.priceJpy * JPY_TO_CNY).toFixed(2)}` : "-";
      case "price_cn": return item.priceCny ? `¥${item.priceCny.toFixed(2)}` : "-";
      case "subtotal": return `¥${((item.priceCny || 0) * item.quantity).toFixed(2)}`;
      case "notes": return item.notes || "";
      default: return "-";
    }
  };

  const getDimensionLabel = (key: string) => EXPORT_DIMENSIONS.find(d => d.key === key)?.label || key;

  const doExportCSV = () => {
    if (items.length === 0) return;
    const selectedList = lists.find(l => l.id === selectedListId);
    const timestamp = new Date().toLocaleString("zh-CN");
    const headers = exportDimensions.map(k => getDimensionLabel(k));
    const rows = items.map(item => exportDimensions.map(k => getItemValue(item, k)));
    const csvContent = [
      `# ${selectedList?.name || "价格列表"} - 导出时间: ${timestamp}`,
      headers.join(","),
      ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")),
      `# 总价值: ¥${totalValue.toLocaleString()}`
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedList?.name || "price-list"}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportConfig(null);
    toast({ title: "导出成功", description: "CSV 文件已下载" });
    const saved = savedPreset?.value ? (() => { try { return JSON.parse(savedPreset.value) as string[]; } catch { return []; } })() : [];
    const currentSorted = [...exportDimensions].sort().join(",");
    const savedSorted = [...saved].sort().join(",");
    if (currentSorted !== savedSorted) {
      setPendingExportDims([...exportDimensions]);
      setShowSavePresetDialog(true);
    }
  };

  const doExportImage = () => {
    if (items.length === 0 || exportDimensions.length === 0) return;
    const selectedList = lists.find(l => l.id === selectedListId);
    const timestamp = new Date().toLocaleString("zh-CN");
    const dims = exportDimensions;
    const colCount = dims.length;
    const colWidth = Math.max(100, Math.min(160, 900 / colCount));
    const tableWidth = colWidth * colCount + 40;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const rowHeight = 36;
    const headerHeight = 80;
    const tableHeaderHeight = 32;
    const footerHeight = 60;
    canvas.width = Math.max(500, tableWidth);
    canvas.height = headerHeight + tableHeaderHeight + items.length * rowHeight + footerHeight + 20;

    ctx.fillStyle = "#faf6f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#2c1810";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(selectedList?.name || "价格列表", 20, 35);
    ctx.fillStyle = "#8b7355";
    ctx.font = "12px sans-serif";
    ctx.fillText(`导出时间: ${timestamp}`, 20, 55);
    ctx.fillText(`汇率: 1 USD ≈ ${USD_TO_CNY} CNY, 1 JPY ≈ ${JPY_TO_CNY} CNY`, 20, 70);

    ctx.fillStyle = "#d4c4a8";
    ctx.fillRect(20, headerHeight, canvas.width - 40, tableHeaderHeight);
    ctx.fillStyle = "#2c1810";
    ctx.font = "bold 11px sans-serif";
    dims.forEach((key, i) => {
      const label = getDimensionLabel(key);
      ctx.fillText(label, 30 + i * colWidth, headerHeight + 20, colWidth - 10);
    });

    items.forEach((item, rowIdx) => {
      const y = headerHeight + tableHeaderHeight + rowIdx * rowHeight;
      if (rowIdx % 2 === 0) {
        ctx.fillStyle = "#f5efe6";
        ctx.fillRect(20, y, canvas.width - 40, rowHeight);
      }
      ctx.fillStyle = "#2c1810";
      ctx.font = "12px sans-serif";
      dims.forEach((key, colIdx) => {
        const val = getItemValue(item, key);
        ctx.fillText(val, 30 + colIdx * colWidth, y + 22, colWidth - 10);
      });
    });

    const footerY = headerHeight + tableHeaderHeight + items.length * rowHeight + 15;
    ctx.fillStyle = "#2c1810";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`总价值: ¥${totalValue.toLocaleString()}`, 30, footerY);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#8b7355";
    ctx.fillText(`MTG Hub · ${timestamp}`, canvas.width - 180, canvas.height - 10);
    ctx.restore();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${selectedList?.name || "price-list"}_${new Date().toISOString().split("T")[0]}.png`;
      link.click();
    });
    setShowExportConfig(null);
    toast({ title: "导出成功", description: "图片已下载" });
    const saved = savedPreset?.value ? (() => { try { return JSON.parse(savedPreset.value) as string[]; } catch { return []; } })() : [];
    const currentSorted = [...exportDimensions].sort().join(",");
    const savedSorted = [...saved].sort().join(",");
    if (currentSorted !== savedSorted) {
      setPendingExportDims([...exportDimensions]);
      setShowSavePresetDialog(true);
    }
  };

  if (selectedListId) {
    const selectedList = lists.find(l => l.id === selectedListId);
    return (
      <div className="space-y-6 pb-24 bg-parchment/30" data-testid="price-list-detail">
        <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-3 -mx-4 px-4 border-b border-border/50">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedListId(null)} data-testid="button-back-lists">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="font-heading font-bold text-sm tracking-widest text-primary/80">{selectedList?.name}</h1>
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowExportMenu(!showExportMenu)} data-testid="button-export-menu">
              <Download className="w-5 h-5" />
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-30 min-w-[140px] py-1">
                <button
                  className="flex items-center gap-2 px-4 py-2.5 text-sm w-full hover:bg-muted/50 transition-colors"
                  onClick={() => { setShowExportMenu(false); setShowExportConfig("image"); }}
                  data-testid="button-export-image"
                >
                  <ImageIcon className="w-4 h-4" /> 导出图片
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 text-sm w-full hover:bg-muted/50 transition-colors"
                  onClick={() => { setShowExportMenu(false); setShowExportConfig("csv"); }}
                  data-testid="button-export-csv"
                >
                  <FileSpreadsheet className="w-4 h-4" /> 导出 CSV
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2.5 text-sm w-full hover:bg-muted/50 transition-colors"
                  onClick={() => { setShowExportMenu(false); }}
                  data-testid="button-export-share"
                >
                  <Share2 className="w-4 h-4" /> 生成分享链接
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground">列表总价值</p>
          <p className="text-2xl font-mono font-bold text-primary" data-testid="text-total-value">¥{totalValue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{items.length} 张卡牌 · {items.reduce((s, i) => s + i.quantity, 0)} 件</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground text-sm">列表为空</p>
            <p className="text-xs text-muted-foreground">在卡牌详情页点击"加入列表"添加卡牌</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const isEditing = editingItemId === item.id;
              return (
                <Card key={item.id} className="border-border/40 overflow-hidden" data-testid={`card-list-item-${item.id}`}>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-14 h-20 rounded overflow-hidden flex-shrink-0 shadow-sm">
                        <img src={item.cardImage || ""} alt={item.cardName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-sm truncate">{item.cardNameCn || item.cardName}</p>
                            <p className="text-[10px] text-muted-foreground">{item.cardName} · {item.cardSetCode}</p>
                          </div>
                          <div className="flex gap-1">
                            {!isEditing ? (
                              <>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditQuantity(item.quantity);
                                  setEditNotes(item.notes || "");
                                  setEditCondition(item.condition || "NM");
                                }} data-testid={`button-edit-item-${item.id}`}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteItem.mutate(item.id)} data-testid={`button-delete-item-${item.id}`}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={() => {
                                  updateItem.mutate({ id: item.id, data: { quantity: editQuantity, notes: editNotes, condition: editCondition } });
                                }} data-testid={`button-save-item-${item.id}`}>
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingItemId(null)} data-testid={`button-cancel-item-${item.id}`}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 pt-1">
                            <div className="flex gap-2 items-center">
                              <label className="text-[10px] text-muted-foreground w-8">数量</label>
                              <Input type="number" min={1} value={editQuantity} onChange={e => setEditQuantity(parseInt(e.target.value) || 1)} className="h-7 text-xs w-16" data-testid={`input-quantity-${item.id}`} />
                              <label className="text-[10px] text-muted-foreground w-8 ml-2">品相</label>
                              <select value={editCondition} onChange={e => setEditCondition(e.target.value)} className="h-7 text-xs border rounded px-1 bg-background" data-testid={`select-condition-${item.id}`}>
                                {["M", "NM", "SP", "MP", "HP", "D"].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="text-[10px] text-muted-foreground w-8">备注</label>
                              <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="版本偏好、语言..." className="h-7 text-xs flex-1" data-testid={`input-notes-${item.id}`} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[9px] h-4 px-1">{item.condition || "NM"}</Badge>
                              <span className="text-[10px] text-muted-foreground">x{item.quantity}</span>
                              {item.notes && <span className="text-[10px] text-muted-foreground italic truncate max-w-[100px]">{item.notes}</span>}
                            </div>
                            <p className="font-mono font-bold text-sm text-primary">¥{((item.priceCny || 0) * item.quantity).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {showExportConfig && (
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowExportConfig(null)}>
            <div className="absolute bottom-0 left-0 right-0 max-w-[500px] mx-auto bg-background rounded-t-2xl shadow-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto" />
              <h3 className="font-heading font-bold text-base text-center">
                导出{showExportConfig === "csv" ? " CSV" : "图片"} — 选择字段
              </h3>
              <p className="text-xs text-muted-foreground text-center">勾选需要包含在导出中的信息维度</p>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-2">卡牌信息</p>
                {EXPORT_DIMENSIONS.filter(d => !d.key.startsWith("price") && d.key !== "subtotal" && d.key !== "quantity" && d.key !== "condition" && d.key !== "notes").map(dim => (
                  <label key={dim.key} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportDimensions.includes(dim.key)}
                      onChange={() => toggleDimension(dim.key)}
                      className="w-4 h-4 accent-primary"
                      data-testid={`checkbox-export-${dim.key}`}
                    />
                    <span className="text-sm">{dim.label}</span>
                  </label>
                ))}

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-3">交易信息</p>
                {EXPORT_DIMENSIONS.filter(d => ["quantity", "condition", "notes"].includes(d.key)).map(dim => (
                  <label key={dim.key} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportDimensions.includes(dim.key)}
                      onChange={() => toggleDimension(dim.key)}
                      className="w-4 h-4 accent-primary"
                      data-testid={`checkbox-export-${dim.key}`}
                    />
                    <span className="text-sm">{dim.label}</span>
                  </label>
                ))}

                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-3">价格信息</p>
                {EXPORT_DIMENSIONS.filter(d => d.key.startsWith("price") || d.key === "subtotal").map(dim => (
                  <label key={dim.key} className="flex items-center gap-3 p-2 rounded hover:bg-muted/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportDimensions.includes(dim.key)}
                      onChange={() => toggleDimension(dim.key)}
                      className="w-4 h-4 accent-primary"
                      data-testid={`checkbox-export-${dim.key}`}
                    />
                    <span className="text-sm">{dim.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  disabled={exportDimensions.length === 0}
                  onClick={showExportConfig === "csv" ? doExportCSV : doExportImage}
                  data-testid="button-confirm-export"
                >
                  导出 ({exportDimensions.length} 项)
                </Button>
                <Button variant="outline" onClick={() => setShowExportConfig(null)}>
                  取消
                </Button>
              </div>
            </div>
          </div>
        )}

        {showSavePresetDialog && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowSavePresetDialog(false)}>
            <div className="bg-background rounded-2xl shadow-2xl p-6 space-y-4 max-w-[360px] mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-base text-center">保存字段组合？</h3>
              <p className="text-sm text-muted-foreground text-center">是否将本次勾选的 {pendingExportDims.length} 个字段保存为默认导出模板？下次导出时将自动使用此组合。</p>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => {
                  savePresetApi.mutate(pendingExportDims);
                  setShowSavePresetDialog(false);
                }} data-testid="button-save-preset">
                  保存为默认
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowSavePresetDialog(false)} data-testid="button-skip-preset">
                  不保存
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24" data-testid="price-lists-page">
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20 py-3 -mx-4 px-4 border-b border-border/50">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-home">
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <h1 className="font-heading font-bold text-sm tracking-widest text-primary/80">价格列表</h1>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCreateForm(true)} data-testid="button-create-list">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-bold">创建新列表</p>
            <Input
              placeholder="输入列表名称..."
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              className="h-9"
              data-testid="input-new-list-name"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createList.mutate(newListName)} disabled={!newListName.trim()} className="flex-1" data-testid="button-confirm-create">
                创建
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowCreateForm(false); setNewListName(""); }} data-testid="button-cancel-create">
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {lists.length === 0 && !showCreateForm && (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground text-sm">还没有价格列表</p>
          <Button variant="outline" onClick={handleCreateDefaults} className="gap-2" data-testid="button-create-defaults">
            <Plus className="w-4 h-4" /> 创建默认列表
          </Button>
          <p className="text-[10px] text-muted-foreground">将自动创建"待购清单"、"出售清单"、"收藏观察"</p>
        </div>
      )}

      <div className="space-y-3">
        {lists.map((list) => (
          <Card
            key={list.id}
            className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedListId(list.id)}
            data-testid={`card-list-${list.id}`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  {list.name === "待购清单" ? <ShoppingCart className="w-5 h-5 text-primary" /> :
                   list.name === "出售清单" ? <Tag className="w-5 h-5 text-green-600" /> :
                   list.name === "收藏观察" ? <Eye className="w-5 h-5 text-blue-500" /> :
                   <MoreHorizontal className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-bold text-sm">{list.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(list.createdAt).toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500"
                  onClick={(e) => { e.stopPropagation(); deleteList.mutate(list.id); }}
                  data-testid={`button-delete-list-${list.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
