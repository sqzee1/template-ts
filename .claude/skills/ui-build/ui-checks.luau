local TARGET = game:GetService("StarterGui"):FindFirstChild("UIBuild")
local SHOW = {}
local RESOLUTIONS = { Vector2.new(1920, 1080), Vector2.new(1366, 768), Vector2.new(1024, 768), Vector2.new(844, 390), Vector2.new(667, 375) }
local TOLERANCE = 2
local MIN_TEXT_PX = 9
local MAX_REPORT = 20

local function path(obj, root)
	local parts = {}
	local cur = obj
	while cur and cur ~= root do
		table.insert(parts, 1, cur.Name)
		cur = cur.Parent
	end
	return table.concat(parts, ".")
end

local function visibleChain(obj, root)
	local cur = obj
	while cur and cur ~= root do
		if cur:IsA("GuiObject") and not cur.Visible then
			return false
		end
		cur = cur.Parent
	end
	return true
end

local function drawn(obj)
	if obj.BackgroundTransparency < 1 then
		return true
	end
	if (obj:IsA("ImageLabel") or obj:IsA("ImageButton")) and obj.Image ~= "" and obj.ImageTransparency < 1 then
		return true
	end
	if (obj:IsA("TextLabel") or obj:IsA("TextButton")) and obj.Text ~= "" and obj.TextTransparency < 1 then
		return true
	end
	return false
end

local function bounds(obj)
	local p, s = obj.AbsolutePosition, obj.AbsoluteSize
	return p.X, p.Y, p.X + s.X, p.Y + s.Y
end

local function overlapArea(a, b)
	local ax0, ay0, ax1, ay1 = bounds(a)
	local bx0, by0, bx1, by1 = bounds(b)
	local w = math.min(ax1, bx1) - math.max(ax0, bx0)
	local h = math.min(ay1, by1) - math.max(ay0, by0)
	return (w > TOLERANCE and h > TOLERANCE) and w * h or 0
end

local function allowsOverflow(obj)
	local cur = obj
	while cur and cur:IsA("GuiObject") do
		if cur:GetAttribute("AllowOverflow") then
			return true
		end
		cur = cur.Parent
	end
	return false
end

local static = {}
local perRes = {}

local function addStatic(text)
	static[text] = true
end

for _, d in TARGET:GetDescendants() do
	if d:IsA("GuiObject") then
		local inLayout = d.Parent and d.Parent:FindFirstChildWhichIsA("UIGridStyleLayout") ~= nil
		local big = math.abs(d.Size.X.Offset) > 2 or math.abs(d.Size.Y.Offset) > 2
		if big and not inLayout and not d:IsA("ScrollingFrame") then
			addStatic("offset-size (nao responsivo): " .. path(d, TARGET))
		end
		if (d:IsA("ImageLabel") or d:IsA("ImageButton")) and d.Name == "Icon" then
			if d.Image == "" then
				addStatic("icone sem imagem: " .. path(d, TARGET))
			end
			if not d:FindFirstChildOfClass("UIAspectRatioConstraint") and d.ScaleType == Enum.ScaleType.Stretch then
				addStatic("icone esticado (sem aspect/Fit): " .. path(d, TARGET))
			end
		end
		if (d:IsA("TextLabel") or d:IsA("TextButton")) and d.Text ~= "" and not d.TextScaled then
			addStatic("texto sem TextScaled: " .. path(d, TARGET))
		end
	end
end

local holderGui = Instance.new("ScreenGui")
holderGui.Name = "UIBuildCheck"
holderGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
holderGui.Enabled = false
holderGui.Parent = game:GetService("StarterGui")

local ok, err = pcall(function()
	for _, res in RESOLUTIONS do
		local holder = Instance.new("Frame")
		holder.Name = "Screen"
		holder.BackgroundTransparency = 1
		holder.Size = UDim2.fromOffset(res.X, res.Y)
		holder.Parent = holderGui
		local source = TARGET:IsA("LayerCollector") and TARGET:GetChildren() or { TARGET }
		for _, child in source do
			local copy = child:Clone()
			copy.Parent = holder
		end
		for _, d in holder:GetDescendants() do
			if SHOW[d.Name] and d:IsA("GuiObject") then
				local cur = d
				while cur and cur ~= holder do
					if cur:IsA("GuiObject") then
						cur.Visible = true
					end
					cur = cur.Parent
				end
			end
		end
		holderGui.Enabled = true
		task.wait()
		task.wait()
		local issues = {}
		local function add(text)
			if #issues < MAX_REPORT then
				table.insert(issues, text)
			end
		end
		local sx0, sy0, sx1, sy1 = bounds(holder)
		for _, d in holder:GetDescendants() do
			if d:IsA("GuiObject") and visibleChain(d, holder) then
				local x0, y0, x1, y1 = bounds(d)
				local name = path(d, holder)
				if drawn(d) and (x0 < sx0 - TOLERANCE or y0 < sy0 - TOLERANCE or x1 > sx1 + TOLERANCE or y1 > sy1 + TOLERANCE) then
					add("fora da tela: " .. name)
				end
				local parent = d.Parent
				if parent:IsA("GuiObject") and parent ~= holder and not parent.ClipsDescendants and not parent:IsA("ScrollingFrame") and not allowsOverflow(d) then
					local px0, py0, px1, py1 = bounds(parent)
					if x0 < px0 - TOLERANCE or y0 < py0 - TOLERANCE or x1 > px1 + TOLERANCE or y1 > py1 + TOLERANCE then
						add(string.format("vaza do pai (%dx%d em %dx%d): %s", x1 - x0, y1 - y0, px1 - px0, py1 - py0, name))
					end
				end
				if (d:IsA("TextLabel") or d:IsA("TextButton")) and d.Text ~= "" then
					if not d.TextFits then
						add("texto cortado: " .. name .. " '" .. d.Text:sub(1, 24) .. "'")
					elseif d.TextScaled and d.TextBounds.Y < MIN_TEXT_PX then
						add(string.format("texto ilegivel (%dpx): %s", d.TextBounds.Y, name))
					end
				end
				if d.AnchorPoint == Vector2.new(0.5, 0.5) and d.Position == UDim2.fromScale(0.5, 0.5) and parent:IsA("GuiObject") and not parent:FindFirstChildWhichIsA("UIGridStyleLayout") then
					local center = d.AbsolutePosition + d.AbsoluteSize / 2
					local parentCenter = parent.AbsolutePosition + parent.AbsoluteSize / 2
					local pad = parent:FindFirstChildOfClass("UIPadding")
					if not pad and (center - parentCenter).Magnitude > TOLERANCE then
						add("descentralizado: " .. name)
					end
				end
			end
		end
		local seen = {}
		for _, d in holder:GetDescendants() do
			if d:IsA("GuiObject") and not seen[d.Parent] then
				seen[d.Parent] = true
				if not d.Parent:FindFirstChildWhichIsA("UIGridStyleLayout") then
					local siblings = {}
					for _, s in d.Parent:GetChildren() do
						if s:IsA("GuiObject") and visibleChain(s, holder) and drawn(s) then
							table.insert(siblings, s)
						end
					end
					for i = 1, #siblings do
						for j = i + 1, #siblings do
							local a, b = siblings[i], siblings[j]
							if a.ZIndex == b.ZIndex and overlapArea(a, b) > 0 then
								add(string.format("z-fight (mesmo ZIndex %d, sobrepostos): %s / %s", a.ZIndex, path(a, holder), b.Name))
							end
						end
					end
				end
			end
		end
		table.insert(perRes, string.format("== %dx%d: %d problema(s)", res.X, res.Y, #issues))
		for _, line in issues do
			table.insert(perRes, "  " .. line)
		end
		holderGui.Enabled = false
		holder:Destroy()
	end
end)

holderGui:Destroy()
if not ok then
	error(err)
end

local lines = { "== estatico ==" }
local count = 0
for text in static do
	count += 1
	if count <= MAX_REPORT then
		table.insert(lines, "  " .. text)
	end
end
lines[1] = "== estatico: " .. count .. " problema(s)"
for _, line in perRes do
	table.insert(lines, line)
end
return table.concat(lines, "\n")
