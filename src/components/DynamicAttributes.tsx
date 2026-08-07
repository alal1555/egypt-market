"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getAttributesBySlug, AttributeField } from '../constants/categoryConfig';

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

export default function DynamicAttributes({ 
  category, 
  formData, 
  setFormData, 
  makes, 
  loadingMakes 
}: DynamicAttributesProps) {
  // Use the helper function to get fields from our new Single Source of Truth
  const fields: AttributeField[] = getAttributesBySlug(category);
  
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
      setModels(data || []);
      setLoadingModels(false);
    }
    fetchModels();
  }, [formData.attributes.make_id]);

  const handleInputChange = (key: string, value: any) => {
    const newAttributes = { ...formData.attributes, [key]: value };
    if (key === 'make_id') newAttributes.model_id = "";
    setFormData({ ...formData, attributes: newAttributes });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {fields.map((field) => {
        // 1. Specialized Make Dropdown
        if (field.key === 'make_id') {
          return (
            <div key="make_id" className="flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-1">Make</label>
              <select
                value={formData.attributes.make_id || ""}
                onChange={(e) => handleInputChange('make_id', e.target.value)}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select Make</option>
                {makes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          );
        }

        // 2. Specialized Model Dropdown
        if (field.key === 'model_id') {
          return (
            <div key="model_id" className="flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-1">Model</label>
              <select
                value={formData.attributes.model_id || ""}
                onChange={(e) => handleInputChange('model_id', e.target.value)}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                disabled={!formData.attributes.make_id || loadingModels}
              >
                <option value="">{loadingModels ? "Loading..." : "Select Model"}</option>
                {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          );
        }

        // 3. Specialized Year Input
        if (field.key === 'year') {
          return (
            <div key="year" className="flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-1">Year</label>
              <input 
                type="number"
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.attributes.year || ""}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. 2024"
              />
            </div>
          );
        }

        // 4. Generic Select Fields
        if (field.type === 'select' && field.options) {
          return (
            <div key={field.key} className="flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-1">{field.label}</label>
              <select
                value={formData.attributes[field.key] || ""}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select {field.label}</option>
                {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          );
        }

        // 5. Generic Input Fields
        return (
          <div key={field.key} className="flex flex-col">
            <label className="text-sm font-bold text-gray-700 mb-1">{field.label}</label>
            <input 
              type={field.type === 'number' ? 'number' : 'text'}
              value={formData.attributes[field.key] || ""}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );
      })}
    </div>
  );
}