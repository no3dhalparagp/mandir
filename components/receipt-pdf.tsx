import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Register standard fonts or custom fonts for Bengali if needed
// Font.register({ family: 'NotoSansBengali', src: '/fonts/NotoSansBengali-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#ea580c", // Orange/Saffron color
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ea580c",
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  receiptInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  value: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f9fafb",
  },
  tableCol: {
    width: "50%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 8,
    fontSize: 10,
    fontWeight: "bold",
  },
  tableCell: {
    margin: 8,
    fontSize: 10,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#666",
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  signature: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: "#000",
    textAlign: "center",
    paddingTop: 5,
  },
});

interface ReceiptData {
  receiptNo: string;
  date: string;
  donorName: string;
  amount: number;
  category: string;
  paymentMode: string;
  qrCodeDataUrl?: string;
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>SHREE MANDIR</Text>
            <Text style={styles.headerSubtitle}>Official Donation Receipt</Text>
          </View>
          {data.qrCodeDataUrl && (
            <Image src={data.qrCodeDataUrl} style={{ width: 50, height: 50 }} alt="QR Code" />
          )}
        </View>

        <View style={styles.receiptInfo}>
          <View>
            <Text style={styles.label}>Receipt No:</Text>
            <Text style={styles.value}>{data.receiptNo}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{data.date}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.label}>Received with thanks from:</Text>
          <Text style={{ ...styles.value, fontSize: 16 }}>
            {data.donorName}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={styles.tableColHeader}>
              <Text style={styles.tableCellHeader}>Amount</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>Donation - {data.category}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>INR {data.amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={styles.label}>Payment Mode:</Text>
          <Text style={styles.value}>{data.paymentMode}</Text>
        </View>

        <View style={styles.signature}>
          <View>
            <Text style={styles.signatureLine}>Donor Signature</Text>
          </View>
          <View>
            <Text style={styles.signatureLine}>Authorized Signatory</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a computer generated receipt and does not require a physical
          signature.
        </Text>
      </Page>
    </Document>
  );
}
