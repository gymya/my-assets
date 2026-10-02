<script setup lang="ts">
import { LayoutDashboard, Wallet, Landmark, Banknote, ChartNoAxesCombined, ChartPie, ArrowUpRight, ArrowDownRight, Plus, RefreshCw, Eye, EyeOff, ChevronRight, ChevronLeft, Settings2, ShieldCheck, Download, Upload, X, Trash2, Pencil, CircleHelp, ArrowRight, WifiOff, CalendarDays, CreditCard, Check, Ellipsis, Menu, HardDrive, Info } from 'lucide-vue-next'
const icons = { dashboard: LayoutDashboard, wallet: Wallet, bank: Landmark, cash: Banknote, trend: ChartNoAxesCombined, pie: ChartPie, up: ArrowUpRight, down: ArrowDownRight, plus: Plus, refresh: RefreshCw, eye: Eye, eyeOff: EyeOff, chevron: ChevronRight, back: ChevronLeft, settings: Settings2, shield: ShieldCheck, download: Download, upload: Upload, close: X, trash: Trash2, edit: Pencil, help: CircleHelp, arrow: ArrowRight, offline: WifiOff, calendar: CalendarDays, credit: CreditCard, check: Check, more: Ellipsis, menu: Menu, storage: HardDrive, info: Info }
defineProps<{ name: keyof typeof icons, size?: number }>()
</script>
<template><component :is="icons[name]" :size="size || 20" :stroke-width="1.7" aria-hidden="true" /></template>
