import React, { useState } from 'react';
import {
  CyberAvatarConfig,
  generateCyberAvatarSvg,
  generateRandomConfig,
  svgToDataUri,
  PALETTES,
  HEADGEARS,
  VISORS,
  MASKS,
  IMPLANTS,
} from '../../utils/cyberAvatarGenerator';
import { sound } from '../../utils/audio';

interface CyberAvatarBuilderModalProps {
  initialConfig?: Partial<CyberAvatarConfig>;
  onSave: (avatarUrl: string) => Promise<void> | void;
  onClose: () => void;
}

export const CyberAvatarBuilderModal: React.FC<CyberAvatarBuilderModalProps> = ({
  onSave,
  onClose,
}) => {
  const [config, setConfig] = useState<CyberAvatarConfig>(generateRandomConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'palette' | 'headgear' | 'visor' | 'mask' | 'implant'>('palette');

  const currentSvg = generateCyberAvatarSvg(config);
  const activePal = PALETTES[config.palette];

  const handleRandomize = () => {
    sound.play('laser');
    setConfig(generateRandomConfig());
  };

  const handleSave = async () => {
    sound.play('score');
    setIsSaving(true);
    try {
      const dataUri = svgToDataUri(currentSvg);
      await onSave(dataUri);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#121211] border-2 border-[#5DF8D8]/40 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(93,248,216,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#252523] flex items-center justify-between bg-[#181816]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#5DF8D8] text-[20px]">
              face_retouching_natural
            </span>
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-white">آواتارساز اختصاصی ۲۰۷۷</span>
              <span className="text-[10px] text-[#5DF8D8] font-mono">
                CYBERNETIC CHASSIS // FORGE
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-[#9E9E9C] hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4">
          {/* Avatar Preview Box & Quick Randomize */}
          <div className="flex items-center justify-center gap-4 bg-[#090908] p-3 rounded-xl border border-white/5 relative">
            <div
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl overflow-hidden border-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              style={{ borderColor: activePal.primary }}
              onClick={handleRandomize}
              title="برای تولید تصادفی کلیک کنید"
              dangerouslySetInnerHTML={{ __html: currentSvg }}
            />

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRandomize}
                className="py-2 px-3 bg-white/5 hover:bg-[#5DF8D8]/15 border border-[#5DF8D8]/30 text-[#5DF8D8] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">shuffle</span>
                <span>ترکیب تصادفی (Random)</span>
              </button>

              <div className="flex items-center gap-1.5">
                {(['hex', 'radar', 'scanlines'] as const).map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => {
                      sound.play('tap');
                      setConfig((c) => ({ ...c, backgroundPattern: bg }));
                    }}
                    className={`px-2 py-1 rounded text-[10px] border font-mono transition-colors ${
                      config.backgroundPattern === bg
                        ? 'bg-[#5DF8D8]/20 border-[#5DF8D8] text-[#5DF8D8] font-bold'
                        : 'bg-white/5 border-white/10 text-[#9E9E9C]'
                    }`}
                  >
                    {bg.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/5 text-xs">
            {[
              { id: 'palette', label: 'رنگ نئون', icon: 'palette' },
              { id: 'headgear', label: 'مو و هدست', icon: 'styler' },
              { id: 'visor', label: 'عینک و HUD', icon: 'visibility' },
              { id: 'mask', label: 'ماسک', icon: 'masks' },
              { id: 'implant', label: 'ایمپلنت', icon: 'memory' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.play('tap');
                  setActiveTab(tab.id as any);
                }}
                className={`py-1.5 px-2.5 rounded-lg border font-semibold flex items-center gap-1 shrink-0 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#5DF8D8]/15 border-[#5DF8D8] text-[#5DF8D8]'
                    : 'bg-white/5 border-transparent text-[#9E9E9C] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Controls */}
          <div className="min-h-[140px]">
            {activeTab === 'palette' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(PALETTES) as (keyof typeof PALETTES)[]).map((pk) => {
                  const pal = PALETTES[pk];
                  const isSel = config.palette === pk;
                  return (
                    <button
                      key={pk}
                      type="button"
                      onClick={() => {
                        sound.play('tap');
                        setConfig((c) => ({ ...c, palette: pk }));
                      }}
                      className="p-2.5 rounded-lg border text-right flex items-center justify-between transition-all"
                      style={{
                        backgroundColor: isSel ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        borderColor: isSel ? pal.primary : 'rgba(255,255,255,0.1)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: pal.primary }}
                        />
                        <span className="text-xs font-bold text-white">{pal.nameFa}</span>
                      </div>
                      {isSel && (
                        <span className="material-symbols-outlined text-[16px]" style={{ color: pal.primary }}>
                          check
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'headgear' && (
              <div className="flex flex-col gap-1.5">
                {HEADGEARS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      sound.play('tap');
                      setConfig((c) => ({ ...c, headgear: h.id }));
                    }}
                    className={`p-2 rounded-lg border text-right text-xs transition-colors flex items-center justify-between ${
                      config.headgear === h.id
                        ? 'bg-[#5DF8D8]/15 border-[#5DF8D8] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-[#9E9E9C] hover:text-white'
                    }`}
                  >
                    <span>{h.nameFa}</span>
                    {config.headgear === h.id && (
                      <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'visor' && (
              <div className="flex flex-col gap-1.5">
                {VISORS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      sound.play('tap');
                      setConfig((c) => ({ ...c, visor: v.id }));
                    }}
                    className={`p-2 rounded-lg border text-right text-xs transition-colors flex items-center justify-between ${
                      config.visor === v.id
                        ? 'bg-[#5DF8D8]/15 border-[#5DF8D8] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-[#9E9E9C] hover:text-white'
                    }`}
                  >
                    <span>{v.nameFa}</span>
                    {config.visor === v.id && (
                      <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'mask' && (
              <div className="flex flex-col gap-1.5">
                {MASKS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      sound.play('tap');
                      setConfig((c) => ({ ...c, mask: m.id }));
                    }}
                    className={`p-2 rounded-lg border text-right text-xs transition-colors flex items-center justify-between ${
                      config.mask === m.id
                        ? 'bg-[#5DF8D8]/15 border-[#5DF8D8] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-[#9E9E9C] hover:text-white'
                    }`}
                  >
                    <span>{m.nameFa}</span>
                    {config.mask === m.id && (
                      <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'implant' && (
              <div className="flex flex-col gap-1.5">
                {IMPLANTS.map((imp) => (
                  <button
                    key={imp.id}
                    type="button"
                    onClick={() => {
                      sound.play('tap');
                      setConfig((c) => ({ ...c, implant: imp.id }));
                    }}
                    className={`p-2 rounded-lg border text-right text-xs transition-colors flex items-center justify-between ${
                      config.implant === imp.id
                        ? 'bg-[#5DF8D8]/15 border-[#5DF8D8] text-white font-bold'
                        : 'bg-white/5 border-white/10 text-[#9E9E9C] hover:text-white'
                    }`}
                  >
                    <span>{imp.nameFa}</span>
                    {config.implant === imp.id && (
                      <span className="material-symbols-outlined text-[#5DF8D8] text-[16px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-[#252523] bg-[#181816] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-[#9E9E9C] hover:text-white text-xs font-semibold transition-colors"
          >
            انصراف
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex-1 py-2 px-4 rounded-lg bg-[#5DF8D8] hover:bg-[#4ae0c0] text-[#0A2821] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(93,248,216,0.3)] active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{isSaving ? 'در حال ثبت...' : 'ذخیره در پروفایل و سرور ابری'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
