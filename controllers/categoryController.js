const Category = require("../models/categoryModel");

const viewCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        return res.render("category/view-category", {
            title: "DeskApp | View Category",
            categories,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error("View category error", error);
        return res.render("category/view-category", {
            title: "DeskApp | View Category",
            categories: [],
            success: null,
            error: "Unable to load categories. Please try again."
        });
    }
};

const addCategoryPage = (req, res) => {
    return res.render("category/add-category", {
        title: "DeskApp | Add Category",
        formData: {},
        error: null
    });
};

const createCategory = async (req, res) => {
    try {
        const category = req.body.category ? req.body.category.trim() : "";

        if (!category) {
            return res.render("category/add-category", {
                title: "DeskApp | Add Category",
                formData: { category },
                error: "Category name is required."
            });
        }

        // duplicate category check
        const existingCategory = await Category.findOne({
            category: { $regex: `^${category}$`, $options: "i" }
        });

        if (existingCategory) {
            return res.render("category/add-category", {
                title: "DeskApp | Add Category",
                formData: { category },
                error: "Category already exists."
            });
        }

        await Category.create({ category });

        return res.redirect("/categories?success=Category%20added%20successfully");
    } catch (error) {
        console.error("Create category error", error);
        return res.render("category/add-category", {
            title: "DeskApp | Add Category",
            formData: req.body,
            error: "Category not added. Please try again."
        });
    }
};

const editCategoryPage = async (req, res) => {
    try {
        const categoryData = await Category.findById(req.params.id);

        if (!categoryData) {
            return res.redirect("/categories?error=Category%20not%20found");
        }

        return res.render("category/edit-category", {
            title: "DeskApp | Edit Category",
            categoryData,
            error: null
        });
    } catch (error) {
        console.error("Edit category page error", error);
        return res.redirect("/categories?error=Invalid%20category%20request");
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = req.body.category ? req.body.category.trim() : "";

        const categoryData = await Category.findById(req.params.id);

        if (!categoryData) {
            return res.redirect("/categories?error=Category%20not%20found");
        }

        if (!category) {
            return res.render("category/edit-category", {
                title: "DeskApp | Edit Category",
                categoryData: { ...categoryData.toObject(), category },
                error: "Category name is required."
            });
        }

        const existingCategory = await Category.findOne({
            _id: { $ne: req.params.id },
            category: { $regex: `^${category}$`, $options: "i" }
        });

        if (existingCategory) {
            return res.render("category/edit-category", {
                title: "DeskApp | Edit Category",
                categoryData: { ...categoryData.toObject(), category },
                error: "Category already exists."
            });
        }

        await Category.findByIdAndUpdate(
            req.params.id,
            { category },
            { new: true }
        );

        return res.redirect("/categories?success=Category%20updated%20successfully");
    } catch (error) {
        console.error("Update category error", error);
        return res.redirect("/categories?error=Category%20not%20updated");
    }
};

const deleteCategory = async (req, res) => {
    try {
        const categoryData = await Category.findById(req.params.id);

        if (!categoryData) {
            return res.redirect("/categories?error=Category%20not%20found");
        }

        await categoryData.deleteOne();

        return res.redirect("/categories?success=Category%20deleted%20successfully");
    } catch (error) {
        console.error("Delete category error", error);
        return res.redirect("/categories?error=Category%20not%20deleted");
    }
};

module.exports = {
    viewCategories,
    addCategoryPage,
    createCategory,
    editCategoryPage,
    updateCategory,
    deleteCategory
};