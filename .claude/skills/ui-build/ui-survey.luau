local ROOTS = { game:GetService("StarterGui"), game:GetService("ReplicatedFirst"), game:GetService("ReplicatedStorage") }
local IGNORE = { UIBuild = true }
local TOP = 12

local CS = game:GetService("CollectionService")

local function hex(c)
	return string.format("#%02X%02X%02X", c.R * 255 + 0.5, c.G * 255 + 0.5, c.B * 255 + 0.5)
end

local function udim(x)
	return string.format("{%.3g,%d}", x.Scale, x.Offset)
end

local function bump(map, key)
	map[key] = (map[key] or 0) + 1
end

local function top(map, limit)
	local list = {}
	for k, v in map do
		table.insert(list, { k = k, v = v })
	end
	table.sort(list, function(a, b)
		return a.v > b.v
	end)
	local out = {}
	for i = 1, math.min(limit or TOP, #list) do
		table.insert(out, "  " .. list[i].k .. "  x" .. list[i].v)
	end
	return #out > 0 and table.concat(out, "\n") or "  none"
end

local guis, fonts, textColors, bgColors, strokes, corners, gradients, images, tags, attributes, layouts = {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
local scaleSized, offsetSized, textScaled, textFixed, aspect = 0, 0, 0, 0, 0

for _, root in ROOTS do
	for _, gui in root:GetDescendants() do
		if gui:IsA("LayerCollector") and not IGNORE[gui.Name] and not gui:FindFirstAncestorOfClass("LayerCollector") then
			local count = #gui:GetDescendants()
			local extra = ""
			if gui:IsA("ScreenGui") then
				extra = string.format(" IgnoreGuiInset=%s ZIndexBehavior=%s ScreenInsets=%s DisplayOrder=%d ResetOnSpawn=%s", tostring(gui.IgnoreGuiInset), gui.ZIndexBehavior.Name, gui.ScreenInsets.Name, gui.DisplayOrder, tostring(gui.ResetOnSpawn))
			end
			table.insert(guis, "  " .. gui:GetFullName() .. " [" .. gui.ClassName .. "] descendants=" .. count .. extra)
			for _, d in gui:GetDescendants() do
				for _, t in CS:GetTags(d) do
					bump(tags, t .. " on " .. d.ClassName)
				end
				for a in d:GetAttributes() do
					bump(attributes, d.ClassName .. "." .. a)
				end
				if d:IsA("GuiObject") then
					local offsetHeavy = math.abs(d.Size.X.Offset) > 2 or math.abs(d.Size.Y.Offset) > 2
					if offsetHeavy then
						offsetSized += 1
					else
						scaleSized += 1
					end
					if d.BackgroundTransparency < 1 then
						bump(bgColors, hex(d.BackgroundColor3) .. string.format(" T=%.2f", d.BackgroundTransparency))
					end
				end
				if d:IsA("TextLabel") or d:IsA("TextButton") or d:IsA("TextBox") then
					bump(fonts, d.FontFace.Family .. " " .. d.FontFace.Weight.Name)
					if d.Text ~= "" then
						bump(textColors, hex(d.TextColor3))
					end
					if d.TextScaled then
						textScaled += 1
					else
						textFixed += 1
					end
				elseif d:IsA("UIStroke") then
					local sizing = "?"
					pcall(function()
						sizing = d.StrokeSizingMode.Name
					end)
					bump(strokes, string.format("%s %s th=%.3g T=%.2f %s on %s", d.ApplyStrokeMode.Name, hex(d.Color), d.Thickness, d.Transparency, sizing, d.Parent.ClassName))
				elseif d:IsA("UICorner") then
					bump(corners, udim(d.CornerRadius) .. " on " .. d.Parent.ClassName)
				elseif d:IsA("UIGradient") then
					local keys = {}
					for _, k in d.Color.Keypoints do
						table.insert(keys, hex(k.Value))
					end
					bump(gradients, table.concat(keys, ">") .. " rot=" .. d.Rotation .. " on " .. d.Parent.ClassName)
				elseif (d:IsA("ImageLabel") or d:IsA("ImageButton")) and d.Image ~= "" then
					bump(images, d.Name .. " " .. d.Image .. " " .. d.ScaleType.Name .. string.format(" T=%.2f", d.ImageTransparency))
				elseif d:IsA("UIAspectRatioConstraint") then
					aspect += 1
				elseif d:IsA("UIGridStyleLayout") or d:IsA("UIPadding") then
					bump(layouts, d.ClassName)
				end
			end
		end
	end
end

local lines = {
	"== guis ==\n" .. (#guis > 0 and table.concat(guis, "\n") or "  none"),
	string.format("== sizing ==\n  scale=%d offset=%d aspectConstraints=%d textScaled=%d textFixed=%d", scaleSized, offsetSized, aspect, textScaled, textFixed),
	"== fonts ==\n" .. top(fonts, 5),
	"== text colors ==\n" .. top(textColors),
	"== background colors ==\n" .. top(bgColors, 20),
	"== strokes ==\n" .. top(strokes, 16),
	"== corners ==\n" .. top(corners),
	"== gradients ==\n" .. top(gradients, 24),
	"== images (textures/icons) ==\n" .. top(images, 16),
	"== layouts ==\n" .. top(layouts),
	"== tags (components) ==\n" .. top(tags),
	"== attributes ==\n" .. top(attributes),
	"== viewport ==\n  " .. tostring(workspace.CurrentCamera.ViewportSize),
}
return table.concat(lines, "\n")
