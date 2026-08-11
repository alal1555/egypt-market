"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getPostAdAttributes, AttributeField } from "../constants/categoryConfig";
import { sortWithOtherLast } from "@/lib/utils";
import { useTranslation } from "@/i18n/LocaleProvider";
import { localizedAttributeLabel, localizedOption } from "@/i18n/catalog";

interface DynamicAttributesProps {
  category: string;
  formData: {
    attributes: Record<string, any>;
    [key: string]: any;
  };
  setFormData: (data: any) => void;
  makes: { id: number; name: string }[];
  loadingMakes: boolean;
}

function fieldInputClass() {
  return "p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 w-full";
}

export default function DynamicAttributes({
  category,
  formData,
  setFormData,
  makes,
  loadingMakes,
}: DynamicAttributesProps) {
  const fields: AttributeField[] = getPostAdAttributes(category);
  const { t, locale } = useTranslation();

  const [models, setModels] = useState<{ id: number; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    async function fetchModels() {
      const makeId = formData.attributes.make_id;
      if (!makeId) {
        setModels([]);
        return;
      }
      setLoadingModels(true);
      const { data } = await supabase
        .from("models")
        .select("id, name")
        .eq("make_id", makeId)
        .order("name");
      setModels(sortWithOtherLast(data || []));
      setLoadingModels(false);
    }
    fetchModels();
  }, [formData.attributes.make_id]);

  const handleInputChange = (key: string, value: string) => {
    const newAttributes = { ...formData.attributes, [key]: value };
    if (key === "make_id") newAttributes.model_id = "";
    setFormData({ ...formData, attributes: newAttributes });
  };

  const handleToggleChange = (key: string, checked: boolean) => {
    const newAttributes = { ...formData.attributes };
    if (checked) {
      newAttributes[key] = "Yes";
    } else {
      delete newAttributes[key];
    }
    setFormData({ ...formData, attributes: newAttributes });
  };

  const renderField = (field: AttributeField) => {
    const cls = fieldInputClass();

    if (field.key === "make_id") {
      return (
        <select
          value={formData.attributes.make_id || ""}
          onChange={(e) => handleInputChange("make_id", e.target.value)}
          className={cls}
        >
          <option value="">{t("common.selectMake")}</option>
          {makes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      );
    }

    if (field.key === "model_id") {
      return (
        <select
          value={formData.attributes.model_id || ""}
          onChange={(e) => handleInputChange("model_id", e.target.value)}
          className={cls}
          disabled={!formData.attributes.make_id || loadingModels}
        >
          <option value="">{loadingModels ? t("common.loading") : t("common.selectModel")}</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "toggle") {
      const checked = formData.attributes[field.key] === "Yes";
      return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => handleToggleChange(field.key, e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-[#FF6321] focus:ring-[#FF6321]"
          />
          <span className="text-sm text-gray-700">{checked ? t("common.yes") : t("common.no")}</span>
        </label>
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <select
          value={formData.attributes[field.key] || ""}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          className={cls}
        >
          <option value="">{t("common.selectOption")} {localizedAttributeLabel(field.label, locale)}</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {localizedOption(opt, locale)}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "range" || field.type === "number") {
      const max = field.key === "year" ? new Date().getFullYear() + 1 : field.max;
      return (
        <input
          type="number"
          min={field.min ?? 0}
          max={max}
          value={formData.attributes[field.key] ?? ""}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          className={cls}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
        />
      );
    }

    return (
      <input
        type="text"
        value={formData.attributes[field.key] || ""}
        onChange={(e) => handleInputChange(field.key, e.target.value)}
        className={cls}
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
      />
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col">
          <label className="text-sm font-bold text-gray-700 mb-1">{localizedAttributeLabel(field.label, locale)}</label>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}
