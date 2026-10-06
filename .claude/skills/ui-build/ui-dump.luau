local TARGET = game:GetService("StarterGui"):FindFirstChild("App")
local MAX_DEPTH = 4
local ONE_PER_LIST = true

local CS = game:GetService("CollectionService")

local function hex(c)
	return string.format("#%02X%02X%02X", c.R * 255 + 0.5, c.G * 255 + 0.5, c.B * 255 + 0.5)
end

local function udim(x)
	return string.format("{%.3g,%d}", x.Scale, x.Offset)
end

local function udim2(v)
	return "(" .. udim(v.X) .. "," .. udim(v.Y) .. ")"
end

local function colors(sequence)
	local keys = {}
	for _, k in sequence.Keypoints do
		table.insert(keys, hex(k.Value))
	end
	return table.concat(keys, ">")
end

local out = {}

local function describe(inst, depth)
	if inst:IsA("Configuration") then
		return
	end
	local s = string.rep(" ", depth) .. inst.Name .. "[" .. inst.ClassName .. "]"
	local tags = CS:GetTags(inst)
	if #tags > 0 then
		s ..= " tags=" .. table.concat(tags, ",")
	end
	if inst:IsA("GuiObject") then
		s ..= " p=" .. udim2(inst.Position) .. " s=" .. udim2(inst.Size) .. " a=" .. string.format("%.2g,%.2g", inst.AnchorPoint.X, inst.AnchorPoint.Y) .. " z=" .. inst.ZIndex
		if inst.BackgroundTransparency < 1 then
			s ..= " bg=" .. hex(inst.BackgroundColor3) .. string.format("/%.2f", inst.BackgroundTransparency)
		end
		if not inst.Visible then
			s ..= " HIDDEN"
		end
		if inst.Rotation ~= 0 then
			s ..= " rot=" .. inst.Rotation
		end
		if inst.ClipsDescendants then
			s ..= " clip"
		end
	end
	if (inst:IsA("ImageLabel") or inst:IsA("ImageButton")) and inst.Image ~= "" then
		s ..= " img=" .. inst.Image .. string.format(" T=%.2f ", inst.ImageTransparency) .. inst.ScaleType.Name
		if inst.ScaleType == Enum.ScaleType.Tile then
			s ..= " tile=" .. udim2(inst.TileSize)
		elseif inst.ScaleType == Enum.ScaleType.Slice then
			s ..= " slice=" .. tostring(inst.SliceCenter)
		end
	end
	if inst:IsA("TextLabel") or inst:IsA("TextButton") or inst:IsA("TextBox") then
		s ..= " '" .. inst.Text:sub(1, 30) .. "' " .. inst.FontFace.Family:match("[^/]+$") .. ":" .. inst.FontFace.Weight.Name .. " tc=" .. hex(inst.TextColor3) .. (inst.TextScaled and " scaled" or " size=" .. inst.TextSize) .. " x=" .. inst.TextXAlignment.Name
	end
	if inst:IsA("UIStroke") then
		s ..= " " .. inst.ApplyStrokeMode.Name .. " " .. hex(inst.Color) .. string.format(" th=%.3g T=%.2f ", inst.Thickness, inst.Transparency) .. inst.StrokeSizingMode.Name
	elseif inst:IsA("UICorner") then
		s ..= " r=" .. udim(inst.CornerRadius)
	elseif inst:IsA("UIGradient") then
		s ..= " " .. colors(inst.Color) .. " rot=" .. inst.Rotation
	elseif inst:IsA("UIAspectRatioConstraint") then
		s ..= string.format(" ratio=%.3g %s %s", inst.AspectRatio, inst.AspectType.Name, inst.DominantAxis.Name)
	elseif inst:IsA("UIPadding") then
		s ..= " L" .. udim(inst.PaddingLeft) .. " R" .. udim(inst.PaddingRight) .. " T" .. udim(inst.PaddingTop) .. " B" .. udim(inst.PaddingBottom)
	elseif inst:IsA("UIGridLayout") then
		s ..= " cell=" .. udim2(inst.CellSize) .. " gap=" .. udim2(inst.CellPadding) .. " max=" .. inst.FillDirectionMaxCells
	elseif inst:IsA("UIListLayout") then
		s ..= " " .. inst.FillDirection.Name .. " gap=" .. udim(inst.Padding) .. " h=" .. inst.HorizontalAlignment.Name .. " v=" .. inst.VerticalAlignment.Name
	elseif inst:IsA("UITextSizeConstraint") then
		s ..= " max=" .. inst.MaxTextSize
	elseif inst:IsA("ScrollingFrame") then
		s ..= " canvas=" .. udim2(inst.CanvasSize) .. " auto=" .. inst.AutomaticCanvasSize.Name
	end
	table.insert(out, s)
	if depth >= MAX_DEPTH then
		local n = #inst:GetChildren()
		if n > 0 then
			table.insert(out, string.rep(" ", depth + 1) .. "...(" .. n .. ")")
		end
		return
	end
	local hasLayout = inst:FindFirstChildWhichIsA("UIGridStyleLayout") ~= nil
	local shown = 0
	for _, child in inst:GetChildren() do
		if ONE_PER_LIST and hasLayout and child:IsA("GuiObject") then
			shown += 1
			if shown > 1 then
				continue
			end
		end
		describe(child, depth + 1)
	end
	if ONE_PER_LIST and shown > 1 then
		table.insert(out, string.rep(" ", depth + 1) .. "+" .. (shown - 1) .. " itens iguais omitidos")
	end
end

describe(TARGET, 0)
return table.concat(out, "\n")
