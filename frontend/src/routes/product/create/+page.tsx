import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../../axios";
import { useLocation } from "wouter";
import styles from "./page.module.css";
import { Notification } from "../../../components/Notification";

interface ProductFormData {
  productName: string;
  price: number;
  details: Record<string, string | number>;
  description: string;
}

export function CreateProductPage() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState<ProductFormData>({
    productName: "",
    price: 0,
    details: {},
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detailsEntries, setDetailsEntries] = useState<
    { key: string; value: string }[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      file,
      data,
      details,
    }: {
      file: File;
      data: ProductFormData;
      details: { key: string; value: string }[];
    }) => {
      const imageFormData = new FormData();
      imageFormData.append("image", file);

      const { data: uploadResponse } = await apiClient.post<{
        filename: string;
      }>("/image", imageFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const finalDetails: Record<string, string | number> = {};
      details.forEach((entry) => {
        if (entry.key.trim()) {
          finalDetails[entry.key.trim()] = entry.value;
        }
      });

      const { data: response } = await apiClient.post("/product", {
        productName: data.productName,
        price: data.price,
        imageFilename: uploadResponse.filename,
        details: finalDetails,
        description: data.description,
      });

      return response;
    },
    onSuccess: () => {
      navigate("/");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to create product",
      );
      notificationRef.current?.showPopover();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select an image");
      notificationRef.current?.showPopover();
      return;
    }
    mutation.mutate({
      file: selectedFile,
      data: formData,
      details: detailsEntries,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const addDetail = () => {
    setDetailsEntries((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeDetail = (index: number) => {
    setDetailsEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDetail = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setDetailsEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h1 className={styles.title}>Create New Product</h1>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="productName">
          Product Name
        </label>
        <input
          id="productName"
          type="text"
          name="productName"
          value={formData.productName}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="price">
          Price
        </label>
        <input
          id="price"
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="price">
          Description
        </label>
        <textarea
          id="price"
          name="price"
          value={formData.description}
          onChange={handleDescriptionChange}
          className={`${styles.input} ${styles.textarea}`}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="image">
          Product Image
        </label>
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className={styles.input}
          required
        />
      </div>
      <div className={styles.detailsContainer}>
        <div className={styles.detailsHeader}>
          <h3>Extra Details</h3>
          <button
            type="button"
            className={styles.btnAddDetail}
            onClick={addDetail}
          >
            + Add Detail
          </button>
        </div>
        {detailsEntries.map((entry, index) => (
          <div key={index} className={styles.detailRow}>
            <input
              type="text"
              placeholder="Detail name (e.g. Size)"
              className={styles.detailInput}
              value={entry.key}
              onChange={(e) => updateDetail(index, "key", e.target.value)}
            />
            <div style={{ display: "flex", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Value (e.g. 18 inches)"
                className={styles.detailInput}
                value={entry.value}
                onChange={(e) => updateDetail(index, "value", e.target.value)}
              />
              <button
                type="button"
                className={styles.btnRemoveDetail}
                onClick={() => removeDetail(index)}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          disabled={mutation.isPending}
          className={` ${styles.btnSubmit} ${
            mutation.isPending ? styles.btnSubmitLoading : ""
          }`}
        >
          {mutation.isPending ? "Creating..." : "Create"}
        </button>
      </div>

      <Notification ref={notificationRef} seconds={5}>
        <p>{errorMessage}</p>
      </Notification>
    </form>
  );
}
